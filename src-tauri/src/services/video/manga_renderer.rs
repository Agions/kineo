//! Manga video rendering engine.
//!
//! Synthesizes novel scenes (images, Ken Burns motion, dialogues, audio and BGM)
//! into full 1080P/4K MP4 playable videos via native FFmpeg, hardware offload,
//! and parallel scene rendering pools.

use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};
use log::info;

use crate::constants::allowed_dirs::temp_subdir;
use crate::models::video_metadata::{MangaSceneParams, RenderFullVideoParams, RenderResult, SubtitleStyleParams};
use crate::services::ffmpeg::{is_ffmpeg_installed, run_ffmpeg};

/// Convert Hex color (#RRGGBB) or ASS color (&H00BBGGRR) to ASS color format
fn to_ass_color(hex_or_ass: &str, default: &str) -> String {
    let s = hex_or_ass.trim();
    if s.starts_with("&H") || s.starts_with("&h") {
        return s.to_string();
    }
    let hex = s.trim_start_matches('#');
    if hex.len() == 6 {
        let r = &hex[0..2];
        let g = &hex[2..4];
        let b = &hex[4..6];
        return format!("&H00{}{}{}", b, g, r);
    }
    default.to_string()
}

/// Format seconds into SRT timestamp HH:MM:SS,mmm
fn format_srt_time(seconds: f64) -> String {
    let total_ms = (seconds.max(0.0) * 1000.0).round() as u64;
    let ms = total_ms % 1000;
    let total_secs = total_ms / 1000;
    let s = total_secs % 60;
    let total_mins = total_secs / 60;
    let m = total_mins % 60;
    let h = total_mins / 60;
    format!("{:02}:{:02}:{:02},{:03}", h, m, s, ms)
}

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

    // 确定目标画幅与分辨率
    let aspect = params.aspect_ratio.as_deref().unwrap_or("16:9");
    let res = params.resolution.as_deref().unwrap_or("1080p").to_lowercase();
    let (width, height) = match (aspect, res.as_str()) {
        ("9:16", "4k") => (2160, 3840),
        ("9:16", "720p") => (720, 1280),
        ("9:16", _) => (1080, 1920),
        ("1:1", "4k") => (2160, 2160),
        ("1:1", "720p") => (720, 720),
        ("1:1", _) => (1080, 1080),
        (_, "4k") => (3840, 2160),
        (_, "720p") => (1280, 720),
        _ => (1920, 1080),
    };

    let temp_dir = temp_subdir(&format!("kineo_manga_{}_{}", params.project_id, std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis()));
    fs::create_dir_all(&temp_dir).map_err(|e| format!("创建渲染临时目录失败: {}", e))?;

    let (encoder, _hw_type) = detect_best_video_encoder();
    info!("🎬 采用视频硬件编码器: {} | 分辨率: {}x{} ({}) | 并行渲染池已就绪", encoder, width, height, aspect);

    let mut segment_paths: Vec<PathBuf> = Vec::new();
    let mut total_duration = 0.0;
    let mut full_subtitles_entries: Vec<(f64, f64, String)> = Vec::new();

    let motion_mode = params.camera_motion_mode.as_deref().unwrap_or("adaptive");
    let motion_intensity = params.motion_intensity.unwrap_or(1.0);
    let sub_enabled = params.subtitle_enabled.unwrap_or(true);

    // 1. 预计算分镜时间线与成片字幕
    for (idx, scene) in params.scenes.iter().enumerate() {
        let duration = if scene.duration > 0.5 { scene.duration } else { 3.5 };
        let start_time = total_duration;
        let end_time = total_duration + duration;
        total_duration = end_time;

        if let Some(ref text) = scene.dialogue {
            if !text.trim().is_empty() {
                full_subtitles_entries.push((start_time, end_time, text.clone()));
            }
        }
        segment_paths.push(temp_dir.join(format!("scene_{:03}.mp4", idx)));
    }

    // 2. 并行分批渲染场景片段 (Parallel Scene Worker Pool: 4 workers per batch)
    let chunk_size = 4;
    for (chunk_idx, scene_chunk) in params.scenes.chunks(chunk_size).enumerate() {
        std::thread::scope(|s| {
            let mut handles = Vec::new();
            for (sub_idx, scene) in scene_chunk.iter().enumerate() {
                let idx = chunk_idx * chunk_size + sub_idx;
                let duration = if scene.duration > 0.5 { scene.duration } else { 3.5 };
                let seg_path = temp_dir.join(format!("scene_{:03}.mp4", idx));
                let enc = encoder.clone();
                let sub_style = params.subtitle_style.as_ref();
                let t_dir = &temp_dir;

                handles.push(s.spawn(move || {
                    render_single_scene(
                        scene,
                        idx,
                        duration,
                        width,
                        height,
                        &enc,
                        sub_enabled,
                        sub_style,
                        motion_mode,
                        motion_intensity,
                        &seg_path,
                        t_dir,
                    )
                }));
            }

            for handle in handles {
                handle.join().map_err(|_| "并发渲染工作线程异常中止".to_string())??;
            }
            Ok::<(), String>(())
        })?;
    }

    // 3. 拼接所有分镜片段
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

    // 4. 混合 BGM 背景音乐（若提供）并导出至目标路径
    let target_output = Path::new(&params.output_path);
    if let Some(parent) = target_output.parent() {
        let _ = fs::create_dir_all(parent);
    }

    let voice_vol = params.voice_volume.unwrap_or(1.0);
    let bgm_vol = params.bgm_volume.unwrap_or(0.25);

    if let Some(ref bgm_path) = params.bgm_path {
        if Path::new(bgm_path).exists() {
            info!("🎵 正在混音背景音乐 (BGM: {:.2}, 人声: {:.2}): {}", bgm_vol, voice_vol, bgm_path);
            let filter = format!("[0:a]volume={:.2}[a1];[1:a]volume={:.2}[a2];[a1][a2]amix=inputs=2:duration=first[aout]", voice_vol, bgm_vol);

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

    // 5. 若开启外挂 SRT 伴随文件导出，生成完整项目的 .srt 文件
    let should_export_srt = params.subtitle_style.as_ref().and_then(|s| s.external_srt).unwrap_or(false);
    if should_export_srt && !full_subtitles_entries.is_empty() {
        let srt_output = target_output.with_extension("srt");
        if let Ok(mut sf) = File::create(&srt_output) {
            for (i, (start, end, dialogue)) in full_subtitles_entries.iter().enumerate() {
                let _ = writeln!(sf, "{}\n{} --> {}\n{}\n", i + 1, format_srt_time(*start), format_srt_time(*end), dialogue);
            }
            info!("📝 已导出外挂伴随字幕: {}", srt_output.display());
        }
    }

    // 6. 清理临时渲染切片
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
    subtitle_style: Option<&SubtitleStyleParams>,
    motion_mode: &str,
    motion_intensity: f64,
    output_path: &Path,
    temp_dir: &Path,
) -> Result<(), String> {
    let img_path = Path::new(&scene.image_path);
    if !img_path.exists() {
        return Err(format!("场景 [{}] 画面图片文件不存在: {}", scene.id, scene.image_path));
    }

    let frames = (duration * 30.0).round() as u32;

    // 确定运镜模式 (含动作震屏 shake 与冲击推进 punch_zoom)
    let effective_motion = if motion_mode == "adaptive" {
        scene.camera_motion.as_deref().unwrap_or(match idx % 6 {
            0 => "zoom_in",
            1 => "zoom_out",
            2 => "punch_zoom",
            3 => "pan_right",
            4 => "shake",
            _ => "pan_left",
        })
    } else {
        scene.camera_motion.as_deref().unwrap_or(motion_mode)
    };

    let step = 0.0012 * motion_intensity;
    let max_zoom = 1.0 + (0.20 * motion_intensity);

    let zoompan_filter = match effective_motion {
        "static" => format!("scale=w={}:h={}:force_original_aspect_ratio=increase,crop={}:{}", width, height, width, height),
        "shake" => format!(
            "scale={}:{},crop=w={}-24:h={}-24:x='(iw-ow)/2+10*sin(50*t)':y='(ih-oh)/2+10*cos(50*t)',scale={}:{}",
            width + 32, height + 32, width + 32, height + 32, width, height
        ),
        "punch_zoom" => format!(
            "scale=8000:-1,zoompan=z='if(lte(on,15),1.0+0.25*(on/15),1.25+0.0006*on)':d={}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={}x{}:fps=30",
            frames, width, height
        ),
        "zoom_out" => format!(
            "scale=8000:-1,zoompan=z='max({:.3}-{:.5}*on,1.0)':d={}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={}x{}:fps=30",
            max_zoom, step, frames, width, height
        ),
        "pan_right" => format!(
            "scale=8000:-1,zoompan=z='{:.2}':d={}:x='min((on/{})*iw*{:.2},iw-iw/zoom)':y='ih/2-(ih/zoom/2)':s={}x{}:fps=30",
            max_zoom.min(1.15), frames, frames, 0.10 * motion_intensity, width, height
        ),
        "pan_left" => format!(
            "scale=8000:-1,zoompan=z='{:.2}':d={}:x='max(iw*{:.2}-(on/{})*iw*{:.2},0)':y='ih/2-(ih/zoom/2)':s={}x{}:fps=30",
            max_zoom.min(1.15), frames, 0.10 * motion_intensity, frames, 0.10 * motion_intensity, width, height
        ),
        _ => format!(
            "scale=8000:-1,zoompan=z='min(zoom+{:.5},{:.3})':d={}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={}x{}:fps=30",
            step, max_zoom, frames, width, height
        ),
    };

    let mut full_filter = format!("{},format=yuv420p", zoompan_filter);

    // 字幕烧录（若有对白）
    if subtitle_enabled && scene.dialogue.as_deref().map(|d| !d.trim().is_empty()).unwrap_or(false) {
        let srt_path = temp_dir.join(format!("sub_{:03}.srt", idx));
        if let Ok(mut sf) = File::create(&srt_path) {
            let dialogue_text = scene.dialogue.as_deref().unwrap();
            let _ = writeln!(sf, "1\n00:00:00,000 --> {}\n{}\n", format_srt_time(duration), dialogue_text);

            let font_size = subtitle_style.and_then(|s| s.font_size).unwrap_or(if width >= 3840 { 44 } else { 22 });
            let font_family = subtitle_style.and_then(|s| s.font_family.as_deref()).unwrap_or("Arial");
            let primary_color = to_ass_color(subtitle_style.and_then(|s| s.primary_color.as_deref()).unwrap_or("#FFFFFF"), "&H00FFFFFF");
            let outline_color = to_ass_color(subtitle_style.and_then(|s| s.outline_color.as_deref()).unwrap_or("#000000"), "&H00000000");
            let outline_width = subtitle_style.and_then(|s| s.outline_width).unwrap_or(2);
            let shadow = subtitle_style.and_then(|s| s.shadow).unwrap_or(1);
            let margin_v = subtitle_style.and_then(|s| s.bottom_margin).unwrap_or(if height >= 2160 { 55 } else { 35 });

            full_filter.push_str(&format!(
                ",subtitles='{}':force_style='FontName={},FontSize={},PrimaryColour={},OutlineColour={},BorderStyle=1,Outline={},Shadow={},Alignment=2,MarginV={}'",
                srt_path.to_string_lossy(),
                font_family,
                font_size,
                primary_color,
                outline_color,
                outline_width,
                shadow,
                margin_v
            ));
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
