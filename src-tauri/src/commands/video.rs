//! Video-related Tauri commands.
//!
//! These are thin wrappers that:
//! 1. Validate input paths
//! 2. Check FFmpeg availability
//! 3. Delegate to the corresponding `services::video` function

use log::info;

use crate::models::video_metadata::{CleanFileParams, CutVideoParams, PreviewParams};
use crate::services::video::{analyzer, cutter, preview};
use crate::utils::path_validator::{validate_input_path, validate_output_path, validate_temp_path};

/// Analyze a video file and return its metadata.
#[tauri::command]
pub fn analyze_video(path: String) -> Result<crate::models::video_metadata::VideoMetadata, String> {
    validate_input_path(&path)?;
    analyzer::analyze(&path)
}

/// Extract `count` evenly-spaced key frames from a video.
#[tauri::command]
pub fn extract_key_frames(path: String, count: u32) -> Result<Vec<String>, String> {
    validate_input_path(&path)?;
    analyzer::extract_key_frames(&path, count)
}

/// Generate a single thumbnail for a video.
#[tauri::command]
pub fn generate_thumbnail(path: String) -> Result<String, String> {
    validate_input_path(&path)?;
    analyzer::generate_thumbnail(&path)
}

/// Cut / splice a video according to segments and transitions.
#[tauri::command]
pub async fn cut_video(params: CutVideoParams) -> Result<String, String> {
    validate_input_path(&params.input_path)?;
    validate_output_path(&params.output_path)?;
    info!("开始剪辑视频: {:?}", params);
    cutter::cut(&params)
}

/// Generate a preview MP4 for a single segment.
#[tauri::command]
pub async fn generate_preview(params: PreviewParams) -> Result<String, String> {
    validate_input_path(&params.input_path)?;
    preview::generate(&params)
}

/// Check FFmpeg installation status and version.
#[tauri::command]
pub fn check_ffmpeg() -> Result<std::collections::HashMap<String, serde_json::Value>, String> {
    use std::process::Command;
    let mut result = std::collections::HashMap::new();

    let is_installed = crate::services::ffmpeg::is_ffmpeg_installed();
    result.insert("installed".to_string(), serde_json::Value::Bool(is_installed));

    if is_installed {
        if let Ok(output) = Command::new("ffmpeg").arg("-version").output() {
            if output.status.success() {
                let version_str = String::from_utf8_lossy(&output.stdout);
                let first_line = version_str.lines().next().unwrap_or("");
                result.insert(
                    "version".to_string(),
                    serde_json::Value::String(first_line.to_string()),
                );
            }
        }
    }

    Ok(result)
}

/// Render full manga video from structured scene assets.
#[tauri::command]
pub async fn render_full_video(params: crate::models::video_metadata::RenderFullVideoParams) -> Result<crate::models::video_metadata::RenderResult, String> {
    info!("接收到端到端漫剧视频渲染请求: {:?}", params.project_id);
    crate::services::video::manga_renderer::render_full_manga_video(&params).await
}

/// Delete a file in one of the allowed temp directories.
#[tauri::command]
pub fn clean_temp_file(params: CleanFileParams) -> Result<(), String> {
    use log::error;
    use std::fs;

    info!("清理临时文件: {}", params.path);

    let canonical_path = validate_temp_path(&params.path)?;

    if canonical_path.is_file() {
        if let Err(e) = fs::remove_file(&canonical_path) {
            error!("删除文件失败: {}", e);
            return Err(format!("清理临时文件失败: {}", e));
        }
    }

    Ok(())
}
