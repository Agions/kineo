//! Video analyzer: extracts metadata and key frames using ffprobe/ffmpeg.

use std::fs;
use std::process::Command;

use log::info;

use crate::models::video_metadata::VideoMetadata;
use crate::services::ffmpeg::is_ffmpeg_installed;
use crate::utils::ffmpeg_utils::parse_fps;
use crate::utils::idgen::random_id;
use crate::constants::allowed_dirs::temp_subdir;

/// Analyze a video file and return its metadata (duration, dimensions, fps, codec, bitrate).
pub fn analyze(path: &str) -> Result<VideoMetadata, String> {
    info!("分析视频: {}", path);

    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }

    let output = Command::new("ffprobe")
        .args(&[
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            path,
        ])
        .output()
        .map_err(|e| format!("运行ffprobe失败: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "ffprobe命令执行失败: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let json_output = String::from_utf8_lossy(&output.stdout);
    let json_value: serde_json::Value =
        serde_json::from_str(&json_output).map_err(|e| format!("解析JSON失败: {}", e))?;

    let streams = json_value["streams"]
        .as_array()
        .ok_or("无法获取视频流信息")?;
    let video_stream = streams
        .iter()
        .find(|s| s["codec_type"].as_str().unwrap_or("") == "video")
        .ok_or("未找到视频流")?;

    let width = video_stream["width"].as_u64().unwrap_or(0) as u32;
    let height = video_stream["height"].as_u64().unwrap_or(0) as u32;

    let fps_str = video_stream["r_frame_rate"].as_str().unwrap_or("0/1");
    let fps = parse_fps(fps_str);

    let codec = video_stream["codec_name"]
        .as_str()
        .unwrap_or("unknown")
        .to_string();

    let format = &json_value["format"];
    let duration = format["duration"]
        .as_str()
        .unwrap_or("0")
        .parse::<f64>()
        .unwrap_or(0.0);

    let bitrate = format["bit_rate"]
        .as_str()
        .unwrap_or("0")
        .parse::<u32>()
        .unwrap_or(0);

    Ok(VideoMetadata {
        duration,
        width,
        height,
        fps,
        codec,
        bitrate,
    })
}

/// Extract `count` evenly-spaced key frames from the video.
/// Returns the absolute paths of the generated JPEG files.
pub fn extract_key_frames(path: &str, count: u32) -> Result<Vec<String>, String> {
    info!("提取关键帧: {}, 数量: {}", path, count);

    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }

    let metadata = analyze(path)?;
    let duration = metadata.duration;

    let temp_dir = temp_subdir("kineo_keyframes");
    fs::create_dir_all(&temp_dir).map_err(|e| format!("创建临时目录失败: {}", e))?;

    let mut frame_positions = Vec::new();
    let segment = duration / (count as f64 + 1.0);

    for i in 1..=count {
        let position = segment * (i as f64);
        frame_positions.push(position);
    }

    let mut frame_paths = Vec::new();

    for (i, &position) in frame_positions.iter().enumerate() {
        let output_path = temp_dir.join(format!("frame_{}.jpg", i + 1));
        let output_str = output_path.to_str().ok_or("路径转换失败")?;

        let status = Command::new("ffmpeg")
            .args(&[
                "-ss", &format!("{}", position),
                "-i", path,
                "-vframes", "1",
                "-q:v", "2",
                "-f", "image2",
                output_str,
            ])
            .status()
            .map_err(|e| format!("运行ffmpeg失败: {}", e))?;

        if !status.success() {
            return Err("提取帧失败".into());
        }

        frame_paths.push(output_str.to_string());
    }

    Ok(frame_paths)
}

/// Generate a single thumbnail for the video, sized to 320px wide.
/// Returns the absolute path of the generated JPEG file.
pub fn generate_thumbnail(path: &str) -> Result<String, String> {
    info!("生成缩略图: {}", path);

    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }

    let temp_dir = temp_subdir("kineo_thumbnails");
    fs::create_dir_all(&temp_dir).map_err(|e| format!("创建临时目录失败: {}", e))?;

    let thumbnail_path = temp_dir.join(format!("thumb_{}.jpg", random_id()));
    let thumbnail_str = thumbnail_path.to_str().ok_or("路径转换失败")?;

    let status = Command::new("ffmpeg")
        .args(&[
            "-ss", "15%",
            "-i", path,
            "-vframes", "1",
            "-vf", "scale=320:-1",
            "-q:v", "2",
            "-f", "image2",
            thumbnail_str,
        ])
        .status()
        .map_err(|e| format!("运行ffmpeg失败: {}", e))?;

    if !status.success() {
        return Err("生成缩略图失败".into());
    }

    Ok(thumbnail_str.to_string())
}
