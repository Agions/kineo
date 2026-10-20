//! Video cutting / editing orchestration.
//!
//! Takes multiple segments and produces a single concatenated output file
//! with optional transitions and per-segment filters (volume, subtitles).

use std::fs::{self, File};
use std::io::Write;

use log::info;

use crate::models::video_metadata::{CutVideoParams, VideoSegment};
use crate::services::ffmpeg::{is_ffmpeg_installed, run_ffmpeg, split_ffmpeg_args};
use crate::services::video::transitions::build_transition_filter;
use crate::constants::allowed_dirs::temp_subdir;

/// Cut a video according to the provided segments + transitions.
/// Returns the output path on success.
pub fn cut(params: &CutVideoParams) -> Result<String, String> {
    info!("开始剪辑视频: {:?}", params);

    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }

    let temp_dir = temp_subdir("kineo_temp");
    fs::create_dir_all(&temp_dir).map_err(|e| format!("创建临时目录失败: {}", e))?;

    let format = params.format.clone().unwrap_or_else(|| "mp4".to_string());
    let quality = params.quality.clone().unwrap_or_else(|| "medium".to_string());

    let (video_codec, video_params) = codec_params(&format, &quality);

    let transition_type = params.transition.clone().unwrap_or_else(|| "none".to_string());
    let transition_duration = params.transition_duration.unwrap_or(1.0);
    let volume = params.volume.unwrap_or(1.0);
    let add_subtitles = params.add_subtitles.unwrap_or(false);

    if params.segments.is_empty() {
        return Err("没有提供有效的片段信息".into());
    }

    let mut segment_files = Vec::new();
    let mut subtitle_files = Vec::new();

    for (i, segment) in params.segments.iter().enumerate() {
        if segment.end <= segment.start {
            info!("忽略无效片段: {:?}", segment);
            continue;
        }

        let duration = segment.end - segment.start;
        let segment_file = temp_dir.join(format!("segment_{}.{}", i, format));
        let segment_path = segment_file.to_string_lossy().to_string();

        let video_filters = build_segment_filters(
            segment,
            duration,
            volume,
            add_subtitles,
            &mut subtitle_files,
            &temp_dir,
        );

        let ffmpeg_args = build_segment_ffmpeg_args(
            segment,
            duration,
            &params.input_path,
            &video_params,
            &video_codec,
            &video_filters,
            &segment_path,
        );

        info!("执行FFmpeg命令: {:?}", ffmpeg_args);
        run_ffmpeg(&ffmpeg_args)?;

        segment_files.push(segment_path);
    }

    if transition_type != "none" && segment_files.len() > 1 {
        segment_files = apply_transitions(
            &segment_files,
            &transition_type,
            transition_duration,
            &format,
            &temp_dir,
        )?;
    }

    let list_file = temp_dir.join("segments.txt");
    let mut file = fs::File::create(&list_file)
        .map_err(|e| format!("创建片段列表文件失败: {}", e))?;
    for segment_path in &segment_files {
        writeln!(file, "file '{}'", segment_path)
            .map_err(|e| format!("写入片段列表失败: {}", e))?;
    }

    let (output_video_codec, output_audio_codec) = if format == "webm" {
        ("libvpx-vp9", "libopus")
    } else {
        ("libx264", "aac")
    };
    let list_file_str = list_file.to_string_lossy().to_string();
    let output_path_str = params.output_path.to_string();

    info!(
        "执行连接命令: list_file={}, output={}",
        list_file_str, output_path_str
    );
    run_ffmpeg(&[
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", &list_file_str,
        "-c:v", output_video_codec,
        "-c:a", output_audio_codec,
        "-strict", "-2",
        &output_path_str,
    ])?;

    cleanup_temp_files(&segment_files, &subtitle_files, &list_file);

    info!("视频剪辑完成: {}", params.output_path);
    Ok(params.output_path.clone())
}

fn codec_params(format: &str, quality: &str) -> (String, String) {
    match format {
        "mp4" | "mov" => {
            let params = match quality {
                "low" => "-vf scale=1280:720 -b:v 1.5M -preset fast",
                "medium" => "-vf scale=1920:1080 -b:v 4M -preset fast",
                "high" => "-b:v 8M -preset slow",
                "ultra" => "-b:v 15M -preset slow",
                _ => "-vf scale=1920:1080 -b:v 4M -preset fast",
            };
            ("libx264".to_string(), params.to_string())
        }
        "webm" => {
            let params = match quality {
                "low" => "-vf scale=1280:720 -b:v 1M",
                "medium" => "-vf scale=1920:1080 -b:v 3M",
                "high" => "-b:v 6M",
                "ultra" => "-b:v 10M",
                _ => "-vf scale=1920:1080 -b:v 3M",
            };
            ("libvpx-vp9".to_string(), params.to_string())
        }
        _ => {
            let params = match quality {
                "low" => "-vf scale=1280:720 -b:v 1.5M",
                "medium" => "-vf scale=1920:1080 -b:v 4M",
                "high" => "-b:v 8M",
                "ultra" => "-b:v 15M",
                _ => "-vf scale=1920:1080 -b:v 4M",
            };
            ("libx264".to_string(), params.to_string())
        }
    }
}

fn build_segment_filters(
    segment: &VideoSegment,
    duration: f64,
    volume: f64,
    add_subtitles: bool,
    subtitle_files: &mut Vec<String>,
    temp_dir: &std::path::Path,
) -> String {
    let mut video_filters = String::new();

    if (volume - 1.0).abs() > 0.01 {
        video_filters.push_str(&format!("volume={}", volume));
    }

    if add_subtitles && segment.content.is_some() {
        let subtitle_file = temp_dir.join(format!("subtitle_{}.srt", random_id_str()));
        let subtitle_path = subtitle_file.to_string_lossy().to_string();
        subtitle_files.push(subtitle_path.clone());

        if let Ok(mut file) = File::create(&subtitle_file) {
            let _ = writeln!(file, "1");
            let _ = writeln!(
                file,
                "00:00:00,000 --> 00:{:02}:{:02},000",
                (duration as u32) / 60,
                (duration as u32) % 60
            );
            let _ = writeln!(file, "{}", segment.content.as_ref().unwrap());
        }

        if !video_filters.is_empty() {
            video_filters.push_str(",");
        }
        video_filters.push_str(&format!("subtitles='{}'", subtitle_path));
    }

    video_filters
}

fn build_segment_ffmpeg_args(
    segment: &VideoSegment,
    duration: f64,
    input_path: &str,
    video_params: &str,
    video_codec: &str,
    video_filters: &str,
    segment_path: &str,
) -> Vec<String> {
    let mut ffmpeg_args: Vec<String> = vec![
        "-y".to_string(),
        "-ss".to_string(),
        segment.start.to_string(),
        "-i".to_string(),
        input_path.to_string(),
        "-t".to_string(),
        duration.to_string(),
    ];
    // video_params is server-controlled (format/quality match arms) — split safely
    ffmpeg_args.extend(split_ffmpeg_args(video_params));
    ffmpeg_args.extend(["-c:v".to_string(), video_codec.to_string()]);
    if !video_filters.is_empty() {
        ffmpeg_args.extend(["-vf".to_string(), video_filters.to_string()]);
    }
    ffmpeg_args.extend([
        "-c:a".to_string(),
        "-strict".to_string(),
        "experimental".to_string(),
        segment_path.to_string(),
    ]);
    ffmpeg_args
}

fn apply_transitions(
    segment_files: &[String],
    transition_type: &str,
    transition_duration: f64,
    format: &str,
    temp_dir: &std::path::Path,
) -> Result<Vec<String>, String> {
    let mut transition_files = Vec::new();

    for i in 0..segment_files.len() - 1 {
        let file1 = &segment_files[i];
        let file2 = &segment_files[i + 1];
        let transition_file = temp_dir.join(format!("transition_{}_{}.{}", i, i + 1, format));
        let transition_path = transition_file.to_string_lossy().to_string();

        let filter_complex =
            build_transition_filter(transition_type, transition_duration);

        info!(
            "执行转场命令: {:?}",
            (file1, file2, &filter_complex, &transition_path)
        );
        run_ffmpeg(&[
            "-y", "-i", file1, "-i", file2,
            "-filter_complex", &filter_complex,
            "-map", "[outv]",
            &transition_path,
        ])?;

        transition_files.push(transition_path);
    }

    Ok(transition_files)
}

fn cleanup_temp_files(
    segment_files: &[String],
    subtitle_files: &[String],
    list_file: &std::path::Path,
) {
    for segment_path in segment_files {
        let _ = fs::remove_file(segment_path);
    }
    for subtitle_path in subtitle_files {
        let _ = fs::remove_file(subtitle_path);
    }
    let _ = fs::remove_file(list_file);
}

fn random_id_str() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    format!("{}", now)
}
