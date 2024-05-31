use crate::ansi_parser::parse_ansi_text::ansi::types::Span;


#[derive(Clone, Debug)]
pub struct ParseOptions {
    pub initial_span: Span,
}

impl ParseOptions {
    pub fn default() -> ParseOptions {
        ParseOptions {
            initial_span: Span::empty(),
        }
    }
    
    pub fn with_initial_span(mut self, initial_span: Span) -> ParseOptions {
        self.initial_span = initial_span;
        self
    }
    
}
