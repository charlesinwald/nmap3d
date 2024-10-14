// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use serde::Serialize;

#[derive(Serialize)]
struct ScanResult {
    output: String,
    error: String,
}

#[tauri::command]
fn run_nmap_scan(target: &str) -> Result<ScanResult, String> {
    let output = Command::new("nmap")
        .arg(target)
        .output()
        .map_err(|e| e.to_string())?;

    Ok(ScanResult {
        output: String::from_utf8_lossy(&output.stdout).to_string(),
        error: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![run_nmap_scan])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
