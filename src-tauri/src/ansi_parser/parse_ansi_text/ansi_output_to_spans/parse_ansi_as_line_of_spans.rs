use memchr::memchr;
use std::iter::Iterator;

use crate::ansi_parser::parse_ansi_text::ansi::ansi_sequence_helpers::{
    get_type_from_ansi_sequence, AnsiSequenceType,
};
use crate::ansi_parser::parse_ansi_text::ansi::colors::Color;
use crate::ansi_parser::parse_ansi_text::ansi::types::Span;
use crate::ansi_parser::parse_ansi_text::raw_ansi_parse::Output;
use crate::ansi_parser::types::Line;

pub enum ResultType {
    // Span here is the next span to be used
    Parse(Line),
    WaitForNext,
}

pub fn convert_ansi_output_lines_of_spans_continues<'a>(
    output: Option<Output<'a>>,
    current_line: &'a mut Line,
) -> ResultType {
    let current_spans = &mut current_line.spans;

    if current_spans.len() == 0 {
        current_spans.push(Span::empty());
    }

    // TODO - remove this as it's not correct and slow
    let size_before = current_spans
        .iter()
        .map(|span| span.text.len())
        .sum::<usize>();
    let current_span = current_spans.last_mut().unwrap();

    let new_line_location = memchr(b'\n', current_span.text.as_slice());

    if let Some(new_line_index) = new_line_location {
        let after_new_line = current_span.text[(new_line_index + 1)..].to_vec();

        let next_line = Line {
            spans: vec![current_span.clone().with_text(after_new_line)],
            location_in_file: current_line.location_in_file + size_before + new_line_index + 1,
        };

        let before_new_line = current_span.text[..new_line_index].to_vec();
        current_span.text = before_new_line;

        if current_span.text.is_empty() {
            current_spans.pop();
        }

        return ResultType::Parse(next_line);
    }

    if output.is_none() {
        return ResultType::WaitForNext;
    }

    let output = output.unwrap();

    return match output {
        Output::TextBlock(text) => {
            current_span.text = [current_span.text.as_slice(), text.text].concat();
            let from_index = text.location_in_text;

            let new_line_location = memchr(b'\n', current_span.text.as_slice());

            if let Some(new_line_index) = new_line_location {
                let after_new_line = current_span.text[(new_line_index + 1)..].to_vec();

                let next_line = Line {
                    spans: vec![current_span.clone().with_text(after_new_line)],
                    location_in_file: from_index + new_line_index + 1,
                };

                let before_new_line = current_span.text[..new_line_index].to_vec();
                current_span.text = before_new_line;

                if current_span.text.is_empty() {
                    current_spans.pop();
                }

                return ResultType::Parse(next_line);
            }

            ResultType::WaitForNext
        }
        Output::Escape(seq) => {
            let sequence_type = get_type_from_ansi_sequence(&seq);

            match sequence_type {
                AnsiSequenceType::Unsupported => ResultType::WaitForNext,
                AnsiSequenceType::Reset => {
                    // Ignore spans that are just empty text even if they have style as this won't be shown
                    if !current_span.text.is_empty() {
                        current_spans.push(Span::empty());
                        return ResultType::WaitForNext;
                    }

                    return ResultType::WaitForNext;
                }
                AnsiSequenceType::ForegroundColor(mut color) => {
                    // Default color is same as none
                    if matches!(color, Color::Default) {
                        color = Color::None;
                    }

                    // TODO - add here that if current color is default or None and new color is default or none don't treat as different
                    if !current_span.text.is_empty() && current_span.color != color {
                        let cloned = current_span.clone();
                        current_spans.push(
                            cloned
                                .with_text(vec![])
                                // Apply the color
                                .with_color(color),
                        );
                    } else {
                        current_span.color = color;
                    }

                    ResultType::WaitForNext
                }
                AnsiSequenceType::BackgroundColor(mut color) => {
                    // Default color is same as none
                    if matches!(color, Color::Default) {
                        color = Color::None;
                    }

                    if !current_span.text.is_empty() && current_span.bg_color != color {
                        let cloned = current_span.clone();
                        current_spans.push(
                            cloned
                                .clone()
                                .with_text(vec![])
                                // Apply the background color
                                .with_bg_color(color),
                        );
                    } else {
                        current_span.bg_color = color;
                    }
                    ResultType::WaitForNext
                }
                AnsiSequenceType::Brightness(brightness) => {
                    if !current_span.text.is_empty() && current_span.brightness != brightness {
                        let cloned = current_span.clone();
                        current_spans.push(
                            cloned
                                .clone()
                                .with_text(vec![])
                                // Apply the background color
                                .with_brightness(brightness),
                        );
                    } else {
                        current_span.brightness = brightness;
                    }
                    ResultType::WaitForNext
                }
                AnsiSequenceType::TextStyle(style) => {
                    if !current_span.text.is_empty() && current_span.text_style != style {
                        let cloned = current_span.clone();
                        let text_style = cloned.text_style;
                        current_spans.push(
                            cloned
                                .with_text(vec![])
                                // Merge the style
                                .with_text_style(text_style | style),
                        );
                    } else {
                        // Merge the style
                        current_span.text_style |= style;
                    }

                    ResultType::WaitForNext
                }
            }
        }
    };
}
