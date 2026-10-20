// Kineo desktop entry point.
//
// On Windows in release builds, hides the console window.
// The actual application logic lives in `lib::run()`.

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

fn main() {
    app_lib::run()
}
