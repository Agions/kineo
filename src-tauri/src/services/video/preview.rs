//! Video preview generation: render a short MP4 for a single segment.

use std::fs::{self, File};
use std::io::Write;

use log::info;

use crate::models::video_metadata::PreviewParams;
use crate::services::ffmpeg::{is_ffmpeg_installed, run_ffmpeg};
use crate::utils::idgen::random_id;
use crate::constants::allowed_dirs::temp_subdir;

/// Generate a preview MP4 for a single segment.
/// Returns the absolute path of the generated preview file.
pub fn generate(params: &PreviewParams) -> Result<String, String> {
    info!("生成预览片段: {:?}", params);

    if !is_ffmpeg_installed() {
        return Err("未安装FFmpeg，请先安装FFmpeg后再试".into());
    }

    let temp_dir = temp_subdir("kineo_preview");
    fs::create_dir_all(&temp_dir).map_err(|e| format!("创建临时目录失败: {}", e))?;

    let preview_file = temp_dir.join(format!("preview_{}.mp4", random_id()));
    let preview_path = preview_file.to_string_lossy().to_string();

    if params.segment.end <= params.segment.start {
        return Err("无效的片段时间范围".into());
    }

    let duration = params.segment.end - params.segment.start;

    let volume = params.volume.unwrap_or(1.0);
    let volume_filter = if (volume - 1.0).abs() > 0.01 {
        format!(",volume={}", volume)
    } else {
        String::new()
    };

    let add_subtitles = params.add_subtitles.unwrap_or(false);
    let subtitle_filter = if add_subtitles {
        if let Some(content) = &params.segment.content {
            let subtitle_file = temp_dir.join(format!("subtitle_{}.srt", random_id()));
            let mut file = File::create(&subtitle_file)
                .map_err(|e| format!("创建字幕文件失败: {}", e))?;

            writeln!(file, "1").map_err(|e| format!("写入字幕失败: {}", e))?;
            writeln!(
                file,
                "00:00:00,000 --> 00:{:02}:{:02},000",
                (duration as u32) / 60,
                (duration as u32) % 60
            )
            .map_err(|e| format!("写入字幕失败: {}", e))?;
            writeln!(file, "{}", content).map_err(|e| format!("写入字幕失败: {}", e))?;

            format!(",subtitles='{}'", subtitle_file.to_string_lossy())
        } else {
            String::new()
        }
    } else {
        String::new()
    };

    let video_filters = format!("scale=1280:720{}{}", volume_filter, subtitle_filter);
    let preview_path_str = preview_path.to_string();

    info!(
        "执行预览命令: start={}, input={}, duration={}, filters={}",
        params.segment.start, params.input_path, duration, video_filters
    );
    run_ffmpeg(&[
        "-y",
        "-ss", &params.segment.start.to_string(),
        "-i", &params.input_path,
        "-t", &duration.to_string(),
        "-vf", &video_filters,
        "-c:v", "libx264",
        "-c:a", "aac",
        "-strict", "experimental",
        &preview_path_str,
    ])?;

    Ok(preview_path)
}
