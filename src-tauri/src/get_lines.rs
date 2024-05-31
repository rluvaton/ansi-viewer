use crate::ansi_parser::files::file_reader::FileReaderOptions;
use crate::ansi_parser::parse_ansi_text::parse_options::ParseOptions;
use crate::ansi_parser::parse_file::file_to_lines_of_spans::read_ansi_file_to_lines;
use crate::ansi_parser::parse_file::types::ReadAnsiFileOptions;
use crate::serialize_to_client::{create_line_from_spans, Line, LinesChunk};

pub fn get_lines_cmd(file_path: String, from_line: usize, to_line: usize) -> Vec<Line> {
    let mut index = from_line;

    return read_ansi_file_to_lines(ReadAnsiFileOptions {
        file_options: FileReaderOptions {
            file_path: file_path.to_string(),
            chunk_size_in_bytes: Some(1024 * 1024 * 3), // 10MB
            from_bytes: None,
            to_bytes: None,
        },
        parse_options: ParseOptions::default(),
    })
        .skip(from_line)
        .take(to_line - from_line + 1)
        .map(|line| {
            let line = create_line_from_spans(index, line.spans);
            index += 1;
            return line;
        })
        .collect();
}
