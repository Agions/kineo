//! Kineo 视频渲染与媒体处理中心

pub mod ffmpeg;
pub mod encoder;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareEncoderCaps {
    pub nvenc: bool,
    pub videotoolbox: bool,
    pub qsv: bool,
    pub active_encoder: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderJobRequest {
    pub project_id: String,
    pub resolution: String,
    pub fps: u32,
    pub output_filename: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderProgress {
    pub current_frame: u32,
    pub total_frames: u32,
    pub progress_percentage: f32,
    pub status: String,
}

pub fn detect_hardware_capabilities() -> HardwareEncoderCaps {
    let videotoolbox = cfg!(target_os = "macos");
    let nvenc = cfg!(target_os = "windows");
    
    let active = if videotoolbox {
        "h264_videotoolbox (Apple Silicon Hardware Accelerated)".to_string()
    } else if nvenc {
        "h264_nvenc (NVIDIA Hardware Accelerated)".to_string()
    } else {
        "libx264 (CPU Software Fallback)".to_string()
    };

    HardwareEncoderCaps {
        nvenc,
        videotoolbox,
        qsv: false,
        active_encoder: active,
    }
}
