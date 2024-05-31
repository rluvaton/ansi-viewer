// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod open_file;
pub mod ansi_parser;
pub mod serialize_to_client;
pub mod get_lines;

use tauri::Manager;
use crate::get_lines::get_lines_cmd;
use crate::open_file::{open_file_cmd};
use crate::serialize_to_client::{FileParsed, Line, LinesChunk};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, test_app_handle, get_window_id, open_file, get_lines])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// define the payload struct
#[derive(Clone, serde::Serialize)]
struct Payload {
    message: String,
}

// make the command
#[tauri::command]
async fn test_app_handle(app: tauri::AppHandle) {
    app.emit_all("event-name", Payload { message: "Tauri is awesome!".into() }).unwrap();
}

// make the command
#[tauri::command]
async fn get_window_id(app: tauri::AppHandle) -> String {
    return "a".to_string();
    // return app.get_window("").unwrap().id().to_string();
    // return "window-id".to_string();
    // app.emit_all("event-name", Payload { message: "Tauri is awesome!".into() }).unwrap();
}

#[tauri::command]
fn open_file(file_path: String) -> Option<FileParsed> {
    return open_file_cmd(file_path);
}

// TODO - change to option if file does not exists or something
#[tauri::command]
fn get_lines(file_path: String, from_line: usize, to_line: usize) -> Vec<Line> {
    return get_lines_cmd(file_path, from_line, to_line);
}

// TODO - add create mapping file command, and return the path to the file, and everytime we scroll we should use it for fast parsing
