// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

extern crate core;

pub mod open_file;
pub mod serialize_to_client;
pub mod get_lines;
mod log_helper;
mod search;

use std::fs::remove_file;
use tauri::Manager;
use crate::get_lines::{get_lines_cmd, get_lines_in_blocks_cmd};
use crate::open_file::{open_file_cmd};
use crate::search::{search_file, SearchResult};
use crate::serialize_to_client::{FileParsed, GetLinesInBlocksPayload, GetLinesPayload, Line, MappingFileCreated, SearchInFilePayload};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, test_app_handle, open_file, get_lines, get_lines_in_blocks, remove_mapping_file, search_in_file])
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
async fn get_lines(data: GetLinesPayload) -> Vec<Line> {
    return get_lines_cmd(data.file_path, data.from_line, data.to_line, data.mapping_file_path);
}

// TODO - change to option if file does not exists or something
#[tauri::command]
async fn get_lines_in_blocks(data: GetLinesInBlocksPayload) -> Vec<Vec<Line>> {
    return get_lines_in_blocks_cmd(data.file_path, data.from_line, data.to_line, data.mapping_file_path, data.block_size);
}

#[tauri::command]
async fn remove_mapping_file(mapping_file_path: String) {
    let result = remove_file(mapping_file_path);

    if result.is_err() {
        let error = result.err().expect("error");
        println!("Failed to remove mapping file: {:?}", error);
    }
}

// TODO - change to option if file does not exists or something
#[tauri::command]
async fn search_in_file(data: SearchInFilePayload) -> Vec<SearchResult> {
    return search_file(data.file_path, data.query);
}

// TODO - add create mapping file command, and return the path to the file, and everytime we scroll we should use it for fast parsing

// TODO -
//  On open file, create mapping file in the background
//  On scroll, read the mapping file and get the lines if available or use the normal way

// TODO -
//  Add tests
//  Add search
