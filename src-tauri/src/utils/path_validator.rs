//! Path validation utilities for preventing path traversal attacks.
//!
//! All file paths from the frontend must be validated before being used
//! in FFmpeg commands or file operations. These helpers enforce two rules:
//! 1. Reject paths containing null bytes (common injection technique)
//! 2. For output paths, enforce an allowlist of safe parent directories

use std::path::PathBuf;

use crate::constants::allowed_dirs::ALLOWED_OUTPUT_DIRS;

/// Validate an input file path. The file MUST exist and be canonicalizable.
/// Returns the canonical path on success.
pub fn validate_input_path(path: &str) -> Result<PathBuf, String> {
    // Reject null bytes (common injection technique)
    if path.contains('\0') {
        return Err("无效的路径".into());
    }

    let file_path = PathBuf::from(path);

    // Canonicalize and verify the file exists
    let canonical = file_path
        .canonicalize()
        .map_err(|e| format!("路径无效: {}", e))?;

    Ok(canonical)
}

/// Validate an output file path. The path's parent directory MUST be in
/// the allowlist (temp dirs or app data dirs).
/// Allows non-existent output paths if the parent directory is allowed.
pub fn validate_output_path(path: &str) -> Result<PathBuf, String> {
    if path.contains('\0') {
        return Err("无效的输出路径".into());
    }

    let file_path = PathBuf::from(path);

    let canonical = file_path
        .canonicalize()
        .or_else(|_| {
            // Allow non-existent output paths if parent dir is allowed
            file_path
                .parent()
                .map(|p| p.canonicalize())
                .unwrap_or_else(|| {
                    Err(std::io::Error::new(
                        std::io::ErrorKind::InvalidInput,
                        "无效路径",
                    ))
                })
        })
        .map_err(|e| format!("输出路径无效: {}", e))?;

    let is_allowed = ALLOWED_OUTPUT_DIRS
        .iter()
        .any(|allowed| canonical.starts_with(allowed));

    if !is_allowed {
        return Err("输出路径不在允许的目录范围内".into());
    }

    Ok(canonical)
}

/// Validate that a path is inside an allowed temp directory.
/// Used for cleanup operations where the file must already exist.
///
/// 【v3.1 安全强化】原实现用 `canonical_path.starts_with(allowed)`，其中 `allowed`
/// 来自 `ALLOWED_TEMP_CLEANUP_DIRS = &["kineo_keyframes", ...]`，**这些是相对名**
/// 而 `canonical_path` 是绝对路径——`starts_with` 实际上永远不匹配，**漏洞：永远拒绝**。
/// 修复：把 allowed 拼接成绝对 temp 目录后再 canonicalize 比较。
pub fn validate_temp_path(path: &str) -> Result<PathBuf, String> {
    use log::error;
    use crate::constants::allowed_dirs::ALLOWED_TEMP_CLEANUP_DIRS;
    use crate::constants::allowed_dirs::temp_subdir;

    if path.contains('\0') {
        return Err("无效的临时文件路径".into());
    }

    let file_path = PathBuf::from(path);

    // Canonicalize the target path to resolve any symlinks/.. components
    let canonical_path = file_path.canonicalize().map_err(|e| {
        error!("路径规范化失败: {}", e);
        format!("路径无效: {}", e)
    })?;

    // 【v3.1 修复】allowed_dirs 是子目录名（如 "kineo_keyframes"），
    // 需拼成 OS temp dir 下的绝对路径再 canonicalize 后比较
    let is_allowed = ALLOWED_TEMP_CLEANUP_DIRS.iter().any(|allowed| {
        let allowed_abs = temp_subdir(allowed);
        let canonical_allowed = allowed_abs
            .canonicalize()
            .unwrap_or_else(|_| allowed_abs);
        canonical_path.starts_with(&canonical_allowed)
    });

    if !is_allowed {
        error!("拒绝清理非临时目录文件: {}", canonical_path.display());
        return Err("无效的临时文件路径".into());
    }

    Ok(canonical_path)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_null_bytes() {
        assert!(validate_input_path("foo\0bar").is_err());
        assert!(validate_output_path("foo\0bar").is_err());
    }

    #[test]
    fn rejects_nonexistent_input() {
        let result = validate_input_path("/nonexistent/path/should/not/exist/xyz123");
        assert!(result.is_err());
    }
}
