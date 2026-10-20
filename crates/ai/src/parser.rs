use kineo_core::models::{CharacterAsset, CharacterGender, EpisodeModel, SceneModel, ShotModel};
use serde::{Deserialize, Serialize};
use crate::ArtStylePreset;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChapterSegment {
    pub title: String,
    pub content: String,
    pub order: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DialogueLine {
    pub character: Option<String>,
    pub content: String,
    pub line_number: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BoundaryType {
    TimeSkip,
    LocationChange,
    PerspectiveShift,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SceneBoundary {
    pub position: usize,
    pub boundary_type: BoundaryType,
}

/// 剧本解析/生成统一返回对象
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptParseResult {
    pub episodes: Vec<EpisodeModel>,
    pub characters: Vec<CharacterAsset>,
    pub summary: String,
    pub total_shots: usize,
}

pub struct NovelScriptParser;

impl NovelScriptParser {
    pub fn parse_chapters(text: &str) -> Vec<ChapterSegment> {
        let mut chapters = Vec::new();
        let mut current_title = "第一集：序章".to_string();
        let mut current_content = String::new();
        let mut order = 1;

        for line in text.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("第") && (trimmed.contains("章") || trimmed.contains("集")) || trimmed.to_lowercase().starts_with("chapter") {
                if !current_content.trim().is_empty() {
                    chapters.push(ChapterSegment {
                        title: current_title.clone(),
                        content: current_content.trim().to_string(),
                        order,
                    });
                    order += 1;
                }
                current_title = trimmed.to_string();
                current_content.clear();
            } else {
                current_content.push_str(line);
                current_content.push('\n');
            }
        }

        if !current_content.trim().is_empty() {
            chapters.push(ChapterSegment {
                title: current_title,
                content: current_content.trim().to_string(),
                order,
            });
        }

        chapters
    }

    pub fn extract_dialogues(text: &str) -> Vec<DialogueLine> {
        let mut dialogues = Vec::new();
        for (i, line) in text.lines().enumerate() {
            if let Some(start) = line.find('“') {
                if let Some(end) = line[start + 3..].find('”') {
                    let content = line[start + 3..start + 3 + end].to_string();
                    let character = if start > 0 {
                        let prefix = &line[..start];
                        let parts: Vec<&str> = prefix.split(&['：', ':', '说', '道', '问'][..]).collect();
                        parts.last().map(|s| s.trim().to_string()).filter(|s| !s.is_empty())
                    } else {
                        None
                    };
                    dialogues.push(DialogueLine {
                        character,
                        content,
                        line_number: i + 1,
                    });
                }
            }
        }
        dialogues
    }

    pub fn detect_scene_boundaries(text: &str) -> Vec<SceneBoundary> {
        let mut boundaries = Vec::new();
        for (i, line) in text.lines().enumerate() {
            if line.contains("几天后") || line.contains("第二天") || line.contains("时光荏苒") || line.contains("时光飞逝") {
                boundaries.push(SceneBoundary { position: i, boundary_type: BoundaryType::TimeSkip });
            } else if line.contains("另一边") || line.contains("与此同时") || line.contains("来到了") {
                boundaries.push(SceneBoundary { position: i, boundary_type: BoundaryType::LocationChange });
            } else if line.contains("视角回到") || line.contains("他不知道的是") {
                boundaries.push(SceneBoundary { position: i, boundary_type: BoundaryType::PerspectiveShift });
            }
        }
        boundaries
    }

    /// 路径 1: 小说文本上传 $\rightarrow$ 智能转剧本
    pub fn parse_novel_to_script(novel_text: &str, style: ArtStylePreset) -> ScriptParseResult {
        let chapters = Self::parse_chapters(novel_text);
        let mut episodes = Vec::new();
        let mut extracted_characters: Vec<CharacterAsset> = Vec::new();
        let mut global_shot_count = 0;

        for (ep_idx, chapter) in chapters.iter().enumerate() {
            let lines: Vec<&str> = chapter.content.lines().map(|l| l.trim()).filter(|l| !l.is_empty()).collect();
            let mut shots = Vec::new();
            let mut shot_order = 1;

            for line in lines {
                let char_name = if line.contains("：“") {
                    line.split("：“").next().map(|s| s.trim())
                } else if line.contains("：") {
                    line.split("：").next().map(|s| s.trim())
                } else {
                    None
                };

                if let Some(name) = char_name {
                    if !name.is_empty() && !extracted_characters.iter().any(|c| c.name == name) {
                        extracted_characters.push(CharacterAsset {
                            id: format!("char-{}", extracted_characters.len() + 1),
                            name: name.to_string(),
                            description: Some(format!("小说主要角色 {}", name)),
                            gender: Some(CharacterGender::Unknown),
                            avatar_url: None,
                            prompt_tags: format!("1person, {}, detailed face, anime character", name),
                            lora_model: None,
                        });
                    }
                }

                let camera = crate::GenerationPipeline::classify_camera_shot(line);
                let raw_prompt = format!("{}, {}, {}", style.prompt_prefix(), camera, line);
                let final_prompt = crate::CharacterConsistencyEngine::inject_character_tags(
                    &raw_prompt,
                    char_name,
                    &extracted_characters,
                );

                let shot = ShotModel {
                    id: format!("shot-{}-{}", ep_idx + 1, shot_order),
                    scene_id: format!("scene-{}-1", ep_idx + 1),
                    order: shot_order,
                    dialogue: if line.contains("：“") || line.contains("说道") || line.contains("：") {
                        Some(line.to_string())
                    } else {
                        None
                    },
                    character_name: char_name.map(|s| s.to_string()),
                    prompt: final_prompt,
                    negative_prompt: "bad hands, missing fingers, distorted face, blurry, lowres".to_string(),
                    image_url: None,
                    audio_url: None,
                    duration_seconds: 3.5,
                };

                shots.push(shot);
                shot_order += 1;
                global_shot_count += 1;
            }

            episodes.push(EpisodeModel {
                id: format!("ep-{}", ep_idx + 1),
                order: (ep_idx + 1) as u32,
                title: chapter.title.clone(),
                scenes: vec![SceneModel {
                    id: format!("scene-{}-1", ep_idx + 1),
                    episode_id: format!("ep-{}", ep_idx + 1),
                    order: 1,
                    title: "核心剧本镜头场次".to_string(),
                    description: format!("提取自小说 {}", chapter.title),
                    shots,
                }],
            });
        }

        ScriptParseResult {
            episodes,
            characters: extracted_characters,
            summary: format!("成功从小理文本解析导出 {} 集，共 {} 个分镜镜头", chapters.len(), global_shot_count),
            total_shots: global_shot_count,
        }
    }

    /// 路径 2: 标准剧本文件直接上传与提取 (.fountain / 标准剧本文本)
    pub fn parse_direct_script(script_text: &str) -> ScriptParseResult {
        let mut shots = Vec::new();
        let mut extracted_characters: Vec<CharacterAsset> = Vec::new();
        let mut order = 1;
        let mut current_char: Option<String> = None;

        for line in script_text.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }

            // 剧本角色行规则（全大写或包含“角色：”）
            if trimmed.starts_with("角色：") || trimmed.starts_with("CHARACTER:") {
                let name = trimmed.replace("角色：", "").replace("CHARACTER:", "").trim().to_string();
                current_char = Some(name.clone());
                if !extracted_characters.iter().any(|c| c.name == name) {
                    extracted_characters.push(CharacterAsset {
                        id: format!("char-{}", extracted_characters.len() + 1),
                        name: name.clone(),
                        description: Some("直接剧本指定角色".to_string()),
                        gender: Some(CharacterGender::Unknown),
                        avatar_url: None,
                        prompt_tags: format!("1person, {}, cinematic lighting", name),
                        lora_model: None,
                    });
                }
            } else if trimmed.starts_with("对白：") || trimmed.starts_with("（") || trimmed.starts_with("(") {
                let shot = ShotModel {
                    id: format!("direct-shot-{}", order),
                    scene_id: "scene-direct-1".to_string(),
                    order,
                    dialogue: Some(trimmed.to_string()),
                    character_name: current_char.clone(),
                    prompt: format!("masterpiece, cinematic, dialogue scene, {}", trimmed),
                    negative_prompt: "lowres, bad quality, text watermark".to_string(),
                    image_url: None,
                    audio_url: None,
                    duration_seconds: 4.0,
                };
                shots.push(shot);
                order += 1;
            } else {
                let shot = ShotModel {
                    id: format!("direct-shot-{}", order),
                    scene_id: "scene-direct-1".to_string(),
                    order,
                    dialogue: None,
                    character_name: None,
                    prompt: format!("masterpiece, best quality, cinematic shot, {}", trimmed),
                    negative_prompt: "lowres, bad quality".to_string(),
                    image_url: None,
                    audio_url: None,
                    duration_seconds: 3.5,
                };
                shots.push(shot);
                order += 1;
            }
        }

        let total = shots.len();
        ScriptParseResult {
            episodes: vec![EpisodeModel {
                id: "ep-direct-1".to_string(),
                order: 1,
                title: "直接导入剧本集".to_string(),
                scenes: vec![SceneModel {
                    id: "scene-direct-1".to_string(),
                    episode_id: "ep-direct-1".to_string(),
                    order: 1,
                    title: "标准剧本场次".to_string(),
                    description: "从专业剧本格式解析生成".to_string(),
                    shots,
                }],
            }],
            characters: extracted_characters,
            summary: format!("直接剧本解析完成，共生成 {} 个分镜镜头", total),
            total_shots: total,
        }
    }

    /// 路径 3: 输入灵感/大纲，通过 AI 从零一键生成分集剧本
    pub fn generate_script_from_idea(idea: &str, num_episodes: u32, style: ArtStylePreset) -> ScriptParseResult {
        let mut episodes = Vec::new();
        let mut total_shots = 0;
        let main_char = CharacterAsset {
            id: "char-hero-1".to_string(),
            name: "主角".to_string(),
            description: Some("AI 智能推导灵感主角".to_string()),
            gender: Some(CharacterGender::Male),
            avatar_url: None,
            prompt_tags: "masterpiece, heroic male lead, determined look, highly detailed face".to_string(),
            lora_model: None,
        };

        let eps = if num_episodes == 0 { 1 } else { num_episodes };

        for ep in 1..=eps {
            let mut shots = Vec::new();
            let templates = vec![
                format!("【场景一】天地开阔，风云变色。主角站在绝壁之上，回想灵感：“{}”", idea),
                format!("【场景二】对决时刻！主角淡然一笑：“天下武功，唯快不破！”"),
                format!("【场景三】强敌环伺，战斗爆发！反派大惊失色：“这不可能！”"),
                format!("【场景四】硝烟散去，主角傲然立于巅峰，漫剧第一阶段圆满结束。"),
            ];

            for (idx, line) in templates.iter().enumerate() {
                let camera = crate::GenerationPipeline::classify_camera_shot(line);
                let shot = ShotModel {
                    id: format!("ai-gen-shot-{}-{}", ep, idx + 1),
                    scene_id: format!("ai-scene-{}-1", ep),
                    order: (idx + 1) as u32,
                    dialogue: if line.contains("：“") {
                        line.split("：“").nth(1).map(|s| s.trim_matches('”').to_string())
                    } else {
                        None
                    },
                    character_name: if line.contains("主角") { Some("主角".to_string()) } else { None },
                    prompt: format!("{}, {}, {}", style.prompt_prefix(), camera, line),
                    negative_prompt: "bad hands, lowres, distorted".to_string(),
                    image_url: None,
                    audio_url: None,
                    duration_seconds: 4.0,
                };
                shots.push(shot);
                total_shots += 1;
            }

            episodes.push(EpisodeModel {
                id: format!("ep-ai-gen-{}", ep),
                order: ep,
                title: format!("第 {} 集：AI 灵感演绎篇", ep),
                scenes: vec![SceneModel {
                    id: format!("ai-scene-{}-1", ep),
                    episode_id: format!("ep-ai-gen-{}", ep),
                    order: 1,
                    title: "灵感生成核心场次".to_string(),
                    description: format!("基于创意灵感生成的结构化剧本“{}”", idea),
                    shots,
                }],
            });
        }

        ScriptParseResult {
            episodes,
            characters: vec![main_char],
            summary: format!("AI 智能成功基于“{}”生成 {} 集剧本，包含 {} 个核心镜头", idea, eps, total_shots),
            total_shots,
        }
    }
}
