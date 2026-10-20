pub mod models;

use models::{EpisodeModel, MangaProject, ProjectMetadata, WorkflowStage, ProjectConfig};
use std::fmt;
use std::fs;
use std::path::Path;

#[derive(Debug)]
pub enum KineoError {
    IoError(std::io::Error),
    SerializationError(serde_json::Error),
    ValidationError(String),
    ProjectNotFound,
    InvalidStageTransition,
}

impl fmt::Display for KineoError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            KineoError::IoError(e) => write!(f, "IO Error: {}", e),
            KineoError::SerializationError(e) => write!(f, "Serialization Error: {}", e),
            KineoError::ValidationError(msg) => write!(f, "Validation Error: {}", msg),
            KineoError::ProjectNotFound => write!(f, "Project Not Found"),
            KineoError::InvalidStageTransition => write!(f, "Invalid Stage Transition"),
        }
    }
}

impl std::error::Error for KineoError {}

impl From<std::io::Error> for KineoError {
    fn from(err: std::io::Error) -> Self {
        KineoError::IoError(err)
    }
}

impl From<serde_json::Error> for KineoError {
    fn from(err: serde_json::Error) -> Self {
        KineoError::SerializationError(err)
    }
}

pub type Result<T> = std::result::Result<T, KineoError>;

pub struct ProjectStore;

impl ProjectStore {
    pub fn create_new_project(name: &str, author: &str) -> MangaProject {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        MangaProject {
            metadata: ProjectMetadata {
                id: format!("prj-{}", now),
                name: name.to_string(),
                author: author.to_string(),
                version: "0.0.1".to_string(),
                created_at: now,
                updated_at: now,
                stage: WorkflowStage::Draft,
            },
            config: ProjectConfig::default(),
            characters: vec![],
            episodes: vec![EpisodeModel {
                id: "ep-1".to_string(),
                order: 1,
                title: "第一集：初入异界".to_string(),
                scenes: vec![],
            }],
        }
    }

    pub fn validate_project(project: &MangaProject) -> Result<()> {
        if project.metadata.name.is_empty() {
            return Err(KineoError::ValidationError("Project name cannot be empty".into()));
        }
        if project.metadata.author.is_empty() {
            return Err(KineoError::ValidationError("Project author cannot be empty".into()));
        }
        Ok(())
    }

    pub fn validate_stage_transition(current: &WorkflowStage, new: &WorkflowStage) -> Result<()> {
        let valid = match (current, new) {
            (WorkflowStage::Draft, WorkflowStage::Parse) => true,
            (WorkflowStage::Parse, WorkflowStage::Board) => true,
            (WorkflowStage::Board, WorkflowStage::Audio) => true,
            (WorkflowStage::Audio, WorkflowStage::Build) => true,
            (WorkflowStage::Build, WorkflowStage::Final) => true,
            _ => false,
        };

        if valid {
            Ok(())
        } else {
            Err(KineoError::InvalidStageTransition)
        }
    }

    pub fn advance_workflow_stage(project: &mut MangaProject, new_stage: WorkflowStage) -> Result<()> {
        Self::validate_stage_transition(&project.metadata.stage, &new_stage)?;
        project.metadata.stage = new_stage;
        project.metadata.updated_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        Ok(())
    }

    pub fn save_to_file(project: &MangaProject, path: &Path) -> Result<()> {
        let json = serde_json::to_string_pretty(project)?;
        fs::write(path, json)?;
        Ok(())
    }

    pub fn load_from_file(path: &Path) -> Result<MangaProject> {
        let content = fs::read_to_string(path)?;
        let project: MangaProject = serde_json::from_str(&content)?;
        Ok(project)
    }
}
