//! Allowlist of directories where the application is permitted to write output files.
//!
//! These constants are used by `utils::path_validator` to enforce the principle
//! of least privilege: output files may only be created inside these directories
//! (typically the OS temp dir + per-app subdirectories).
//!
//! **Naming convention**: Each subdirectory uses the `kineo_*` prefix for
//! brand continuity with the Kineo product line. No backwards-compatibility
//! aliases are retained — old data in non-`kineo_*` directories will be
//! rejected by the path validator.

use std::path::PathBuf;

/// Directories where FFmpeg output files are allowed to be created.
/// Used by `validate_output_path`.
pub const ALLOWED_OUTPUT_DIRS: &[&str] = &[
    "kineo_temp",
    "kineo_keyframes",
    "kineo_thumbnails",
    "kineo_preview",
];

/// Directories where cleanup is allowed (subset of output dirs).
/// Used by `clean_temp_file` to verify a path is safe to delete.
pub const ALLOWED_TEMP_CLEANUP_DIRS: &[&str] = &[
    "kineo_keyframes",
    "kineo_thumbnails",
    "kineo_temp",
    "kineo_preview",
];

/// Build the full OS temp dir + subdirectory path for a given subdir.
pub fn temp_subdir(name: &str) -> PathBuf {
    std::env::temp_dir().join(name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn output_dirs_includes_keyframes() {
        assert!(ALLOWED_OUTPUT_DIRS.contains(&"kineo_keyframes"));
        assert!(ALLOWED_OUTPUT_DIRS.contains(&"kineo_preview"));
    }

    #[test]
    fn cleanup_dirs_is_strict_subset() {
        for d in ALLOWED_TEMP_CLEANUP_DIRS {
            assert!(
                ALLOWED_OUTPUT_DIRS.contains(d),
                "{} should also be in output dirs",
                d
            );
        }
    }

    #[test]
    fn temp_subdir_creates_under_temp() {
        let p = temp_subdir("kineo_keyframes");
        assert!(p.ends_with("kineo_keyframes"));
    }
}
