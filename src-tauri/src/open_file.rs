use std::ffi::OsString;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::thread;

use ansi_parser_extended::files::file_reader::FileReaderOptions;
use ansi_parser_extended::mapping_file::create::create_mapping_file_from_input_path;
use ansi_parser_extended::parse_ansi_text::parse_options::ParseOptions;
use ansi_parser_extended::parse_file::file_to_lines_of_spans::read_ansi_file_to_lines;
use ansi_parser_extended::parse_file::types::ReadAnsiFileOptions;
use tauri::Manager;
use tempfile::NamedTempFile;

use crate::log_helper::measure_fn_time;
use crate::serialize_to_client::{create_line_from_spans, FileParsed, Line, MappingFileCreated};

fn get_tmp_file_path() -> PathBuf {
    return NamedTempFile::new()
        .expect("create temp file")
        .into_temp_path()
        .to_path_buf();
}

pub fn open_file_cmd(window: tauri::Window, file_path: String) -> Option<FileParsed> {
    let other = file_path.clone();

    // TODO - if changed file remove current mapping file

    // Not in release mode it will take around 17 seconds to parse a 1GB file, in release mode it will take around 1 second
    thread::spawn(move || {
        measure_fn_time(
            "create mapping file", || {
                let mapping_file_path = get_tmp_file_path();

                create_mapping_file_from_input_path(
                    mapping_file_path.clone(),
                    PathBuf::from(OsString::from(file_path.clone())),
                );

                // If file changed remove the current mapping file
                // TODO -
                //   1. If file changed remove the current mapping file
                //   2. If file changed abort the current mapping file creation

                // TODO - if mapping file created is sent before the file result is sent, the client will not be able to use the mapping file
                let result = window.emit_to(window.label(), "mapping-file-created", MappingFileCreated {
                    mapping_file_path: mapping_file_path.to_str().expect("mapping file path is not valid").to_string(),
                    file_path: file_path.clone(),
                });

                if result.is_err() {
                    let error = result.err().expect("error");
                    println!("Failed to emit mapping file created event: {:?}", error);
                }
            },
        );
    });


    let number_of_lines = measure_fn_time(
        "get number of lines",
        || get_number_of_lines(other.as_str()),
    );

    let first_lines = measure_fn_time(
        "get lines sync",
        || get_lines_sync(other.as_str()),
    );

    return Some(FileParsed {
        file_path: other.clone(),
        total_lines: number_of_lines,
        first_lines,
        global_style: "".to_string(),
        requested_from_client: true,
    });
}

fn get_number_of_lines(file_path: &str) -> usize {
    let file = File::open(file_path).unwrap();
    let reader = BufReader::new(file);
    return reader.lines().count();
}

fn get_lines_sync(file_path: &str) -> Vec<Line> {
    let mut index = 0;

    return read_ansi_file_to_lines(ReadAnsiFileOptions {
        file_options: FileReaderOptions {
            file_path: file_path.to_string(),
            chunk_size_in_bytes: Some(1024 * 1024 * 3), // 10MB
            from_bytes: None,
            to_bytes: None,
        },
        parse_options: ParseOptions::default(),
    })
        .take(1000)
        .map(|line| {
            let line = create_line_from_spans(index, line.spans);
            index += 1;
            return line;
        })
        .collect();
}

