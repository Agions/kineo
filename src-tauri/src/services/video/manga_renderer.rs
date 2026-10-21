//! Manga video rendering engine.
//!
//! Synthesizes novel scenes (images, Ken Burns motion, dialogues, audio and BGM)
//! into full 1080P/4K MP4 playable videos via native FFmpeg and hardware offload.

use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};
use log::info;

use crate::constants::allowed_dirs::temp_subdir;
use crate::models::video_metadata::{MangaSceneParams, RenderFullVideoParams, RenderResult};
use crate::services::ffmpeg::{is_ffmpeg_installed, run_ffmpeg};

/// Detect available video encoder on the host platform
pub fn detect_best_video_encoder() -> (String, &'static str) {
    use std::process::Command;
    if let Ok(output) = Command::new("ffmpeg").arg("-encoders").output() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        if stdout.contains("h264_videotoolbox") {
            return ("h264_videotoolbox".to_string(), "videotoolbox");
        }
        if stdout.contains("h264_nvenc") {
            return ("h264_nvenc".to_string(), "nvenc");
        }
    }
    ("libx264".to_string(), "software")
}

/// Render full manga video from structured scene assets
pub async fn render_full_manga_video(params: &RenderFullVideoParams) -> Result<RenderResult, String> {
    info!("🚀 开始执行端到端漫剧视频渲染: 工程 [{}] 场景数: {}", params.project_id, params.scenes.len());

    if !is_ffmpeg_installed() {
        return Err("系统中未检测到 FFmpeg！请先安装 FFmpeg (brew install ffmpeg 或 Windows PATH)".into());
    }

    if params.scenes.is_empty() {
        return Err("渲染队列为空，未提供任何漫剧分镜场景".into());
    }

    // 确定目标分辨率
    let (width, height) = match params.resolution.as_deref() {
        Some("4k") | Some("4K") => (3840, 2160),
        Some("720p") => (1280, 720),
        _ => (1920, 1080),
    };

    let temp_dir = temp_subdir(&format!("kineo_manga_{}_{}", params.project_id, std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis()));
    fs::create_dir_all(&temp_dir).map_err(|e| format!("创建渲染临时目录失败: {}", e))?;

    let (encoder, _hw_type) = detect_best_video_encoder();
    info!("🎬 采用视频硬件编码器: {}", encoder);

    let mut segment_paths: Vec<PathBuf> = Vec::new();
    let mut total_duration = 0.0;

    // 1. 逐幕生成场景片段
    for (idx, scene) in params.scenes.iter().enumerate() {
        let duration = if scene.duration > 0.5 { scene.duration } else { 3.5 };
        total_duration += duration;

        let seg_path = temp_dir.join(format!("scene_{:03}.mp4", idx));
        render_single_scene(scene, idx, duration, width, height, &encoder, params.subtitle_enabled.unwrap_or(true), &seg_path, &temp_dir)?;
        segment_paths.push(seg_path);
    }

    // 2. 拼接所有分镜片段
    let concat_list_path = temp_dir.join("concat_list.txt");
    {
        let mut f = File::create(&concat_list_path).map_err(|e| format!("创建合并清单失败: {}", e))?;
        for p in &segment_paths {
            writeln!(f, "file '{}'", p.to_string_lossy()).map_err(|e| format!("写入合并清单失败: {}", e))?;
        }
    }

    let joined_video_path = temp_dir.join("joined_scenes.mp4");
    info!("🔗 正在连接 {} 组场景片段...", segment_paths.len());
    run_ffmpeg(&[
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", &concat_list_path.to_string_lossy(),
        "-c", "copy",
        &joined_video_path.to_string_lossy(),
    ])?;

    // 3. 混合 BGM 背景音乐（若提供）并导出至目标路径
    let target_output = Path::new(&params.output_path);
    if let Some(parent) = target_output.parent() {
        let _ = fs::create_dir_all(parent);
    }

    if let Some(ref bgm_path) = params.bgm_path {
        if Path::new(bgm_path).exists() {
            info!("🎵 正在混音背景音乐: {}", bgm_path);
            let bgm_vol = params.bgm_volume.unwrap_or(0.25);
            let filter = format!("[0:a]volume=1.0[a1];[1:a]volume={}[a2];[a1][a2]amix=inputs=2:duration=first[aout]", bgm_vol);

            run_ffmpeg(&[
                "-y",
                "-i", &joined_video_path.to_string_lossy(),
                "-stream_loop", "-1",
                "-i", bgm_path,
                "-filter_complex", &filter,
                "-map", "0:v",
                "-map", "[aout]",
                "-c:v", "copy",
                "-c:a", "aac",
                "-b:a", "192k",
                "-shortest",
                &target_output.to_string_lossy(),
            ])?;
        } else {
            fs::copy(&joined_video_path, target_output).map_err(|e| format!("保存成片视频失败: {}", e))?;
        }
    } else {
        fs::copy(&joined_video_path, target_output).map_err(|e| format!("保存成片视频失败: {}", e))?;
    }

    // 4. 清理临时渲染切片
    let _ = fs::remove_dir_all(&temp_dir);

    let file_size = fs::metadata(target_output).map(|m| m.len()).unwrap_or(0);
    info!("🎉 漫剧视频压制完成! 目标路径: {} ({:.2} MB, {:.1} 秒)", target_output.display(), file_size as f64 / 1024.0 / 1024.0, total_duration);

    Ok(RenderResult {
        output_path: params.output_path.clone(),
        duration: total_duration,
        file_size,
        encoder_used: encoder,
    })
}

/// 渲染单幕分镜为独立 MP4 片段
fn render_single_scene(
    scene: &MangaSceneParams,
    idx: usize,
    duration: f64,
    width: u32,
    height: u32,
    encoder: &str,
    subtitle_enabled: bool,
    output_path: &Path,
    temp_dir: &Path,
) -> Result<(), String> {
    let img_path = Path::new(&scene.image_path);
    if !img_path.exists() {
        return Err(format!("场景 [{}] 画面图片文件不存在: {}", scene.id, scene.image_path));
    }

    let frames = (duration * 30.0).round() as u32;

    // 运镜滤镜表达式构建 (Ken Burns)
    let motion = scene.camera_motion.as_deref().unwrap_or("zoom_in");
    let zoompan_filter = match motion {
        "zoom_out" => format!(
            "scale=8000:-1,zoompan=z='max(1.20-0.001*on,1.0)':d={}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={}x{}:fps=30",
            frames, width, height
        ),
        "pan_right" => format!(
            "scale=8000:-1,zoompan=z='1.15':d={}:x='min((on/{})*iw*0.1,iw-iw/zoom)':y='ih/2-(ih/zoom/2)':s={}x{}:fps=30",
            frames, frames, width, height
        ),
        "pan_left" => format!(
            "scale=8000:-1,zoompan=z='1.15':d={}:x='max(iw*0.1-(on/{})*iw*0.1,0)':y='ih/2-(ih/zoom/2)':s={}x{}:fps=30",
            frames, frames, width, height
        ),
        _ => format!(
            "scale=8000:-1,zoompan=z='min(zoom+0.0012,1.20)':d={}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={}x{}:fps=30",
            frames, width, height
        ),
    };

    let mut full_filter = format!("{},format=yuv420p", zoompan_filter);

    // 字幕烧录（若有对白）
    if subtitle_enabled && scene.dialogue.as_deref().map(|d| !d.trim().is_empty()).unwrap_or(false) {
        let srt_path = temp_dir.join(format!("sub_{:03}.srt", idx));
        if let Ok(mut sf) = File::create(&srt_path) {
            let dialogue_text = scene.dialogue.as_deref().unwrap();
            let _ = writeln!(sf, "1\n00:00:00,000 --> 00:{:02}:{:02},000\n{}\n", (duration as u32) / 60, (duration as u32) % 60, dialogue_text);
            full_filter.push_str(&format!(",subtitles='{}':force_style='FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=2,Shadow=1,Alignment=2,MarginV=35'", srt_path.to_string_lossy()));
        }
    }

    let has_audio = scene.audio_path.as_ref().map(|p| Path::new(p).exists()).unwrap_or(false);

    let mut args: Vec<String> = vec![
        "-y".to_string(),
        "-loop".to_string(), "1".to_string(),
        "-i".to_string(), scene.image_path.clone(),
    ];

    if has_audio {
        args.extend(vec![
            "-i".to_string(), scene.audio_path.clone().unwrap(),
        ]);
    } else {
        args.extend(vec![
            "-f".to_string(), "lavfi".to_string(),
            "-i".to_string(), "anullsrc=r=44100:cl=stereo".to_string(),
        ]);
    }

    args.extend(vec![
        "-vf".to_string(), full_filter,
        "-c:v".to_string(), encoder.to_string(),
        "-t".to_string(), format!("{:.3}", duration),
        "-c:a".to_string(), "aac".to_string(),
        "-pix_fmt".to_string(), "yuv420p".to_string(),
        "-shortest".to_string(),
        output_path.to_string_lossy().to_string(),
    ]);

    run_ffmpeg(&args)?;
    Ok(())
}
