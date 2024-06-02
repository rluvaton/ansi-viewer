use std::ffi::OsString;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;

use ansi_parser_extended::files::file_reader::FileReaderOptions;
use ansi_parser_extended::mapping_file::create::create_mapping_file_from_input_path;
use ansi_parser_extended::parse_ansi_text::parse_options::ParseOptions;
use ansi_parser_extended::parse_file::file_to_lines_of_spans::read_ansi_file_to_lines;
use ansi_parser_extended::parse_file::types::ReadAnsiFileOptions;
use tempfile::NamedTempFile;

use crate::log_helper::measure_fn_time;
use crate::serialize_to_client::{create_line_from_spans, FileParsed, Line};

fn get_tmp_file_path() -> PathBuf {
    return NamedTempFile::new()
        .expect("create temp file")
        .into_temp_path()
        .to_path_buf();
}

pub fn open_file_cmd(file_path: String) -> Option<FileParsed> {
    let other = file_path.clone();
    let mapping_file_path = get_tmp_file_path();

    // TODO - run in background and emit progress + result when done
    measure_fn_time(
        "create mapping file", ||
            create_mapping_file_from_input_path(
                mapping_file_path.clone(),
                PathBuf::from(OsString::from(other)),
            ),
    );

    let number_of_lines = measure_fn_time(
        "get number of lines",
        || get_number_of_lines(file_path.as_str()),
    );

    let first_lines = measure_fn_time(
        "get lines sync",
        || get_lines_sync(file_path.as_str()),
    );

    return Some(FileParsed {
        filePath: file_path.clone(),
        totalLines: number_of_lines,
        firstLines: first_lines,
        globalStyle: "".to_string(),
        requestedFromClient: true,
        mappingFilePath: mapping_file_path.to_str().expect("mapping file path is not valid").to_string(),
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

