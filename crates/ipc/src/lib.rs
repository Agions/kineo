//! Kineo Strong-Typed IPC & Tauri Command Module

pub mod commands {
    use kineo_ai::{parser::NovelScriptParser, parser::ScriptParseResult, ArtStylePreset, GenerationPipeline};
    use kineo_core::models::{EpisodeModel, MangaProject};
    use kineo_core::ProjectStore;
    use kineo_media::{detect_hardware_capabilities, HardwareEncoderCaps};
    use tauri::command;

    #[command]
    pub fn get_kineo_version() -> String {
        "0.0.1".to_string()
    }

    #[command]
    pub fn create_new_project(name: String, author: String) -> MangaProject {
        ProjectStore::create_new_project(&name, &author)
    }

    #[command]
    pub fn parse_novel_script(text: String) -> Vec<EpisodeModel> {
        GenerationPipeline::execute_optimized_pipeline(&text, ArtStylePreset::ModernAnime, &[])
    }

    #[command]
    pub fn execute_advanced_pipeline(text: String, style_preset: String) -> Vec<EpisodeModel> {
        let preset = match style_preset.as_str() {
            "xianxia" => ArtStylePreset::Xianxia,
            "cyberpunk" => ArtStylePreset::Cyberpunk,
            "shonen" => ArtStylePreset::ShonenAction,
            "dark_fantasy" => ArtStylePreset::DarkFantasy,
            _ => ArtStylePreset::ModernAnime,
        };

        GenerationPipeline::execute_optimized_pipeline(&text, preset, &[])
    }

    #[command]
    pub fn detect_hardware_accel() -> HardwareEncoderCaps {
        detect_hardware_capabilities()
    }

    #[command]
    pub fn get_project_config() -> kineo_core::models::ProjectConfig {
        kineo_core::models::ProjectConfig::default()
    }

    #[command]
    pub fn validate_project_data(name: String, author: String) -> Result<bool, String> {
        if name.is_empty() {
            return Err("Project name cannot be empty".to_string());
        }
        if author.is_empty() {
            return Err("Project author cannot be empty".to_string());
        }
        Ok(true)
    }

    /// 路径 1: 小说文本上传 $\rightarrow$ 智能转换全功能剧本
    #[command]
    pub fn parse_novel_to_script(text: String, style_preset: String) -> ScriptParseResult {
        let preset = match style_preset.as_str() {
            "xianxia" => ArtStylePreset::Xianxia,
            "cyberpunk" => ArtStylePreset::Cyberpunk,
            "shonen" => ArtStylePreset::ShonenAction,
            "dark_fantasy" => ArtStylePreset::DarkFantasy,
            _ => ArtStylePreset::ModernAnime,
        };
        NovelScriptParser::parse_novel_to_script(&text, preset)
    }

    /// 路径 2: 直接上传专业格式剧本
    #[command]
    pub fn parse_direct_script(text: String) -> ScriptParseResult {
        NovelScriptParser::parse_direct_script(&text)
    }

    /// 路径 3: 输入创意灵感/大纲，AI 自动生成分集剧本
    #[command]
    pub fn generate_script_from_idea(idea: String, episodes: u32, style_preset: String) -> ScriptParseResult {
        let preset = match style_preset.as_str() {
            "xianxia" => ArtStylePreset::Xianxia,
            "cyberpunk" => ArtStylePreset::Cyberpunk,
            "shonen" => ArtStylePreset::ShonenAction,
            "dark_fantasy" => ArtStylePreset::DarkFantasy,
            _ => ArtStylePreset::ModernAnime,
        };
        NovelScriptParser::generate_script_from_idea(&idea, episodes, preset)
    }
}
