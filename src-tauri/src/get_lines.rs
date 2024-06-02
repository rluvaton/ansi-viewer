use std::cmp::min;
use std::ffi::OsString;
use std::path::PathBuf;

use ansi_parser_extended::files::file_reader::FileReaderOptions;
use ansi_parser_extended::parse_ansi_text::ansi::types::Span;
use ansi_parser_extended::parse_ansi_text::parse_options::ParseOptions;
use ansi_parser_extended::parse_file::file_to_lines_of_spans::read_ansi_file_to_lines;
use ansi_parser_extended::parse_file::from_middle_of_file::get_from_middle_of_the_file_info;
use ansi_parser_extended::parse_file::types::ReadAnsiFileOptions;

use crate::serialize_to_client::{create_line_from_spans, Line};

pub fn get_lines_cmd(file_path: String, from_line: usize, to_line: usize, mapping_file: Option<&String>) -> Vec<Line> {
    let input_file_path = PathBuf::from(OsString::from(file_path.clone()));

    let middle_of_file_info =
        get_from_middle_of_the_file_info(input_file_path, Some(&from_line), Some(&to_line), mapping_file);

    let mut chunk_size_in_bytes = 1024 * 1024 * 10; // 10MB

    if let Some(to_bytes) = middle_of_file_info.to_bytes {
        chunk_size_in_bytes = min(chunk_size_in_bytes, to_bytes - middle_of_file_info.from_bytes.unwrap_or(0));
    }

    let file_reader_options = FileReaderOptions {
        file_path: file_path,
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

    let mut index = from_line;

    return read_ansi_file_to_lines(options)
        .map(|line| {
            let line = create_line_from_spans(index, line.spans);
            index += 1;
            return line;
        })
        .collect::<Vec<Line>>();
}
