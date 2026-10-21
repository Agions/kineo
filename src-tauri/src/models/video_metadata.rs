//! Video metadata extracted from ffprobe output.

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VideoMetadata {
    pub duration: f64,
    pub width: u32,
    pub height: u32,
    pub fps: f64,
    pub codec: String,
    pub bitrate: u32,
}

#[derive(Deserialize, Debug, Clone)]
pub struct VideoSegment {
    pub start: f64,
    pub end: f64,
    pub content: Option<String>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct CutVideoParams {
    pub input_path: String,
    pub output_path: String,
    pub segments: Vec<VideoSegment>,
    pub quality: Option<String>,
    pub format: Option<String>,
    pub transition: Option<String>,
    pub transition_duration: Option<f64>,
    pub volume: Option<f64>,
    pub add_subtitles: Option<bool>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct PreviewParams {
    pub input_path: String,
    pub segment: VideoSegment,
    pub volume: Option<f64>,
    pub add_subtitles: Option<bool>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct CleanFileParams {
    pub path: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MangaSceneParams {
    pub id: String,
    pub image_path: String,
    pub audio_path: Option<String>,
    pub duration: f64,
    pub camera_motion: Option<String>,
    pub transition: Option<String>,
    pub dialogue: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct SubtitleStyleParams {
    pub font_size: Option<u32>,
    pub font_family: Option<String>,
    pub primary_color: Option<String>, // e.g. "#FFFFFF", "#FFD700", "#00F0FF" or ASS "&H00FFFFFF"
    pub outline_color: Option<String>, // e.g. "#000000" or ASS "&H00000000"
    pub outline_width: Option<u32>,
    pub shadow: Option<u32>,
    pub bottom_margin: Option<u32>,
    pub external_srt: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RenderFullVideoParams {
    pub project_id: String,
    pub output_path: String,
    pub scenes: Vec<MangaSceneParams>,
    pub bgm_path: Option<String>,
    pub bgm_volume: Option<f64>,
    pub voice_volume: Option<f64>,
    pub resolution: Option<String>,
    pub aspect_ratio: Option<String>,
    pub quality: Option<String>,
    pub subtitle_enabled: Option<bool>,
    pub subtitle_style: Option<SubtitleStyleParams>,
    pub camera_motion_mode: Option<String>,
    pub motion_intensity: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RenderResult {
    pub output_path: String,
    pub duration: f64,
    pub file_size: u64,
    pub encoder_used: String,
}
