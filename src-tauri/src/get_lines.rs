use std::cmp::min;
use std::ffi::OsString;
use std::path::PathBuf;

use ansi_parser_extended::files::file_reader::FileReaderOptions;
use ansi_parser_extended::parse_ansi_text::ansi::types::Span;
use ansi_parser_extended::parse_ansi_text::parse_options::ParseOptions;
use ansi_parser_extended::parse_file::file_to_lines_of_spans::read_ansi_file_to_lines;
use ansi_parser_extended::parse_file::from_middle_of_file::get_from_middle_of_the_file_info;
use ansi_parser_extended::parse_file::types::ReadAnsiFileOptions;

use crate::log_helper::measure_fn_time;
use crate::serialize_to_client::{create_line_from_spans, Line};

pub fn get_ansi_file_lines(file_path: String, from_line: usize, to_line: usize, mapping_file: Option<String>) -> Box<dyn Iterator<Item=ansi_parser_extended::types::Line>> {
    let input_file_path = PathBuf::from(OsString::from(file_path.clone()));

    let mapping_file_string_desc = mapping_file.is_none()
        .then(|| "without mapping file")
        .unwrap_or_else(|| "with mapping file");

    let middle_of_file_info = measure_fn_time(
        format!("Get middle of file info {}", mapping_file_string_desc).as_str(),
        // TODO - check before if from line and to line exists
        || get_from_middle_of_the_file_info(input_file_path, Some(from_line), Some(to_line), mapping_file),
    );


    let mut chunk_size_in_bytes = 1024 * 1024 * 10; // 10MB

    if let Some(to_bytes) = middle_of_file_info.to_bytes {
        chunk_size_in_bytes = min(chunk_size_in_bytes, to_bytes - middle_of_file_info.from_bytes.unwrap_or(0));
    }

    let file_reader_options = FileReaderOptions {
        file_path,
        chunk_size_in_bytes: Some(chunk_size_in_bytes),
        from_bytes: middle_of_file_info.from_bytes,
        to_bytes: middle_of_file_info.to_bytes,
    };
    let parse_options = ParseOptions::default()
        .with_initial_span(middle_of_file_info.initial_span.unwrap_or(Span::empty()));

    let options = ReadAnsiFileOptions {
        file_options: file_reader_options,
        parse_options,
    };

    return Box::new(read_ansi_file_to_lines(options));
}

pub fn get_lines_cmd(file_path: String, from_line: usize, to_line: usize, mapping_file: Option<String>) -> Vec<Line> {

    let mapping_file_string_desc = mapping_file.is_none()
        .then(|| "without mapping file")
        .unwrap_or_else(|| "with mapping file");

    let iter = get_ansi_file_lines(file_path, from_line, to_line, mapping_file);

    let mut index = from_line;

    return measure_fn_time(
        format!("read ANSI file lines {}", mapping_file_string_desc).as_str(),
        || iter
            .map(|line| {
                let line = create_line_from_spans(index, line.spans);
                index += 1;
                return line;
            })
            .collect::<Vec<Line>>(),
    );
}

pub fn get_lines_in_blocks_cmd(file_path: String, from_line: usize, to_line: usize, mapping_file: Option<String>, block_size: usize) -> Vec<Vec<Line>> {
    let mapping_file_string_desc = mapping_file.is_none()
        .then(|| "without mapping file")
        .unwrap_or_else(|| "with mapping file");

    let iter = get_ansi_file_lines(file_path, from_line, to_line, mapping_file);

    let mut index = from_line;

    return measure_fn_time(
        format!("read ANSI file lines {}", mapping_file_string_desc).as_str(),
        || {
            let mut blocks: Vec<Vec<Line>> = Vec::with_capacity(to_line - from_line / block_size + 1);
            let mut current_block: Vec<Line> = Vec::with_capacity(block_size);

            for line in iter {
                index += 1;

                if (current_block.len() == block_size) {
                    blocks.push(current_block);
                    current_block = Vec::with_capacity(block_size)
                }

                current_block.push(create_line_from_spans(index, line.spans))
            }

            if !current_block.is_empty() {
                current_block.shrink_to_fit();
                blocks.push(current_block);
            }

            blocks.shrink_to_fit();

            return blocks;
        },
    );
}
