//! Kineo Industry-Grade AI Generation & Consistency Engine

pub mod parser;
pub mod prompt;
use kineo_core::models::{CharacterAsset, EpisodeModel, SceneModel, ShotModel};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ArtStylePreset {
    Xianxia,       // 仙侠国风
    ModernAnime,   // 现代日漫
    Cyberpunk,     // 赛博朋克
    ShonenAction,  // 热血战斗
    DarkFantasy,   // 暗黑奇幻
}

impl ArtStylePreset {
    pub fn prompt_prefix(&self) -> &'static str {
        match self {
            ArtStylePreset::Xianxia => "masterpiece, 8k, xianxia anime style, ethereal lighting, oriental aesthetic, highly detailed face",
            ArtStylePreset::ModernAnime => "masterpiece, best quality, modern anime style, vibrant colors, Makoto Shinkai aesthetic",
            ArtStylePreset::Cyberpunk => "masterpiece, cyberpunk anime, neon lighting, futuristic city, cinematic composition",
            ArtStylePreset::ShonenAction => "masterpiece, dynamic action shot, ufotable anime style, high contrast, impact frames",
            ArtStylePreset::DarkFantasy => "masterpiece, dark fantasy anime, dramatic lighting, detailed texture, cinematic shading",
        }
    }
}

/// 角色视觉一致性协议 (Master Reference Protocol)
pub struct CharacterConsistencyEngine;

impl CharacterConsistencyEngine {
    pub fn inject_character_tags(
        base_prompt: &str,
        character_name: Option<&str>,
        characters: &[CharacterAsset],
    ) -> String {
        if let Some(name) = character_name {
            if let Some(char_asset) = characters.iter().find(|c| c.name == name) {
                return format!("{}, {}, {}", char_asset.prompt_tags, base_prompt, char_asset.lora_model.as_deref().unwrap_or(""));
            }
        }
        base_prompt.to_string()
    }
}

pub struct GenerationPipeline;

impl GenerationPipeline {
    /// 镜头构图与镜头语言推导器 ("One Verb, One Modifier" 规则引擎)
    pub fn classify_camera_shot(line: &str) -> &'static str {
        if line.contains("神情") || line.contains("眼神") || line.contains("流泪") || line.contains("微笑") || line.contains("凝视") {
            "Close-up shot, detailed facial expression, soft focus background"
        } else if line.contains("大喊") || line.contains("拔剑") || line.contains("冲向") || line.contains("挥拳") || line.contains("跃起") {
            "Dynamic action shot, dutch angle, speed lines, high tension"
        } else if line.contains("天空") || line.contains("宗门") || line.contains("大殿") || line.contains("繁华") || line.contains("街道") {
            "Wide panoramic establishing shot, grand atmosphere, cinematic scale"
        } else {
            "Medium shot, character waist-up, rule of thirds composition"
        }
    }

    /// 执行多阶段工业级生成管线
    pub fn execute_optimized_pipeline(
        novel_text: &str,
        style: ArtStylePreset,
        characters: &[CharacterAsset],
    ) -> Vec<EpisodeModel> {
        let lines: Vec<&str> = novel_text.lines().map(|l| l.trim()).filter(|l| !l.is_empty()).collect();
        let mut shots = Vec::new();
        let mut order = 1;

        for line in lines {
            let camera = Self::classify_camera_shot(line);
            let char_name = if line.contains("：“") {
                line.split("：“").next().map(|s| s.trim())
            } else {
                None
            };

            let raw_prompt = format!("{}, {}, {}", style.prompt_prefix(), camera, line);
            let final_prompt = CharacterConsistencyEngine::inject_character_tags(
                &raw_prompt,
                char_name,
                characters,
            );

            let shot = ShotModel {
                id: format!("shot-{}", order),
                scene_id: "scene-main".to_string(),
                order,
                dialogue: if line.contains("：“") || line.contains("说道") {
                    Some(line.to_string())
                } else {
                    None
                },
                character_name: char_name.map(|s| s.to_string()),
                prompt: final_prompt,
                negative_prompt: "bad hands, missing fingers, extra limbs, lowres, distorted face, blurry, text, watermark".to_string(),
                image_url: None,
                audio_url: None,
                duration_seconds: 3.5,
            };

            shots.push(shot);
            order += 1;
        }

        vec![EpisodeModel {
            id: "ep-1".to_string(),
            order: 1,
            title: "第一集：工业级制作篇".to_string(),
            scenes: vec![SceneModel {
                id: "scene-main".to_string(),
                episode_id: "ep-1".to_string(),
                order: 1,
                title: "核心分镜序列".to_string(),
                description: "Master Reference Protocol 智能生成分镜".to_string(),
                shots,
            }],
        }]
    }
}
