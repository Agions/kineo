//! Kineo (Kineo AI) Tauri desktop backend.
//!
//! This crate is the Rust-side first citizen of the desktop application.
//! It exposes Tauri commands to the JS frontend, and is internally organized
//! as:
//!
//! - `commands::*` — thin Tauri command routing (no business logic)
//! - `services::*` — business logic (FFmpeg, settings, video processing)
//! - `models::*`   — data structures
//! - `utils::*`    — path validation, ID generation, FFmpeg helpers
//! - `constants::*`— allowlists and other compile-time constants
//!
//! `lib.rs` itself contains only the application entry point and the
//! Tauri builder; no business logic lives here.

mod commands;
mod constants;
mod models;
mod services;
mod utils;

// warn! 仅在 Windows 条件下使用；跨平台编译时允许未使用
#[allow(unused_imports)]
use log::{error, info, warn};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Windows release: env_logger 无控制台可见，写入文件方便诊断
    #[cfg(all(not(debug_assertions), target_os = "windows"))]
    {
        let log_path = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|d| d.join("kineo.log")));
        if let Some(path) = log_path {
            if let Ok(file) = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(&path)
            {
                env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
                    .target(env_logger::Target::Pipe(Box::new(file)))
                    .init();
            } else {
                env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
                    .init();
            }
        } else {
            env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
                .init();
        }
    }

    #[cfg(not(all(not(debug_assertions), target_os = "windows")))]
    {
        env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
            .init();
    }

    info!("Kineo (Kineo AI) 启动中...");

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::default().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::default().build())
    .setup(|_app| {
        info!("应用程序初始化完成");

        #[cfg(target_os = "windows")]
        {
            use std::process::Command;
            // reg 是 cmd.exe 内置命令，需通过 cmd /c 调用
            let status = Command::new("cmd")
                .args(&[
                    "/c",
                    "reg",
                    "query",
                    "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
                ])
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .status();
            match status {
                Ok(s) if s.success() => {
                    info!("WebView2 运行时已安装");
                }
                _ => {
                    warn!("未检测到 WebView2 运行时，部分功能可能无法使用。请访问 https://developer.microsoft.com/en-us/microsoft-edge/webview2/ 安装");
                }
            }
        }

        Ok(())
    })
        .invoke_handler(tauri::generate_handler![
            kineo_ipc::commands::get_kineo_version,
            kineo_ipc::commands::create_new_project,
            kineo_ipc::commands::parse_novel_script,
            kineo_ipc::commands::execute_advanced_pipeline,
            kineo_ipc::commands::detect_hardware_accel,
            kineo_ipc::commands::parse_novel_to_script,
            kineo_ipc::commands::parse_direct_script,
            kineo_ipc::commands::generate_script_from_idea,
            commands::video::analyze_video,
            commands::video::extract_key_frames,
            commands::video::generate_thumbnail,
            commands::video::cut_video,
            commands::video::generate_preview,
            commands::video::clean_temp_file,
            commands::video::check_ffmpeg,
            commands::app::show_main_window,
            commands::app::hide_main_window,
            commands::app::toggle_fullscreen,
            commands::app::get_app_settings,
            commands::app::save_app_settings,
            commands::app::check_runtime_dependencies,
            commands::app::get_app_data_path,
            commands::app::open_file_location,
            commands::file::check_app_data_directory,
            commands::file::save_project_file,
            commands::file::read_project_file,
            commands::file::list_app_data_files,
            commands::file::delete_project_file,
            commands::file::remove_file,
        ])
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            error!("Tauri 启动失败: {}", e);
            std::process::exit(1);
        });
}
