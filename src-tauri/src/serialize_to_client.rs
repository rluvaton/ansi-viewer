use ansi_parser_extended::parse_ansi_text::ansi::types::Span;

#[derive(Clone, Debug, serde::Serialize)]
pub struct FileParsed {
    pub filePath: String,
    pub totalLines: usize,
    pub firstLines: Vec<Line>,
    pub globalStyle: String,
    pub requestedFromClient: bool,
    pub mappingFilePath: String,
}

#[derive(Clone, Debug, serde::Serialize)]
pub struct LinesChunk {
    pub file_path: String,
    pub from_line: usize,
    pub to_line: usize,
    pub lines: Vec<Line>,
}

#[derive(Clone, Debug, serde::Serialize)]
pub struct Line {
    pub lineIndex: usize,
    pub __html: String,
}

pub fn create_line_from_spans(line_index: usize, items: Vec<Span>) -> Line {
    // Mark the inner pre as content-editable="true" so the user can navigate the text with the keyboard
    let spans_as_string = items
        .iter()
        .map(|span| {
            let text = String::from_utf8_lossy(span.text.as_slice());
            let css = span.create_css_string();
            let mut style = "".to_string();

            if !css.is_empty() {
                style = format!("style=\"{}\"", css);
            }


            format!("<pre {}>{}</pre>",
                    style,
                    text
            )
        })
        .collect::<String>();

    let __html = format!(r####"
    <code contenteditable="false" class="line-number noselect">{line_index}</code>
    <pre role="presentation" contenteditable="true" spellcheck="false" data-disable-content-edit data-line="{line_index}" class="strip-content-editable-style">{spans_as_string}</pre>
"####, line_index = line_index + 1, spans_as_string = spans_as_string);

    return Line {
        lineIndex: line_index,
        __html,
    };
}



