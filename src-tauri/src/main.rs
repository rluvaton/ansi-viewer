// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod open_file;
pub mod serialize_to_client;
pub mod get_lines;
mod log_helper;

use std::fs::remove_file;
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
        .invoke_handler(tauri::generate_handler![greet, test_app_handle, open_file, get_lines, remove_mapping_file])
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

#[tauri::command]
async fn open_file(window: tauri::Window, file_path: String) -> Option<FileParsed> {
    // TODO - should create mapping file in different thread
    return open_file_cmd(window, file_path);
}

// TODO - change to option if file does not exists or something
#[tauri::command]
async fn get_lines(file_path: String, from_line: usize, to_line: usize, mapping_file_path: Option<String>) -> Vec<Line> {
    return get_lines_cmd(file_path, from_line, to_line, mapping_file_path);
}

#[tauri::command]
async fn remove_mapping_file(mapping_file_path: String) {
    let result = remove_file(mapping_file_path);

    if result.is_err() {
        let error = result.err().expect("error");
        println!("Failed to remove mapping file: {:?}", error);
    }
}

// TODO - add create mapping file command, and return the path to the file, and everytime we scroll we should use it for fast parsing

// TODO -
//  On open file, create mapping file in the background
//  On scroll, read the mapping file and get the lines if available or use the normal way

// TODO -
//  Add tests
//  Add search
