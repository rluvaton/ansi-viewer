use crate::ansi_parser::parse_ansi_text::raw_ansi_parse::{AnsiSequence, Output, parse_escape, Text};
use crate::ansi_parser::parse_ansi_text::ansi_text_to_output::parse::parse_ansi;
use crate::ansi_parser::parse_ansi_text::ansi_text_to_output::str_part_parse::parse_single_ansi;

use std::fmt::Write;

macro_rules! test_parser {
    ($name:ident, $bytes:expr) => {
        #[test]
        fn $name() {
            let ret = parse_escape($bytes, true);

            assert!(ret.is_ok());
            let ret = ret.unwrap().1;

            
            let mut underline = String::new();
            write!(&mut underline, "{}", ret).unwrap();
            
            let buff = underline.into_bytes();

            assert_eq!(buff, $bytes);
        }
    };
}

macro_rules! test_def_val_parser {
    ($name:ident, $bytes:expr) => {
        #[test]
        fn $name() {
            let ret = parse_escape($bytes, true);

            assert!(ret.is_ok());
            let ret = ret.unwrap().1;
            
            let mut underline = String::new();
            write!(&mut underline, "{}", ret).unwrap();
            
            let buff = underline.into_bytes();

            let ret2 = parse_escape(&buff, true);
            assert!(ret2.is_ok());

            let ret2 = ret2.unwrap().1;
            assert_eq!(ret, ret2);
        }
    };
}

test_def_val_parser!(cursor_pos_default, b"\x1b[H");
test_def_val_parser!(cursor_pos, b"\x1b[10;5H");
test_def_val_parser!(cursor_up_default, b"\x1b[A");
test_def_val_parser!(cursor_up, b"\x1b[5A");
test_def_val_parser!(cursor_down, b"\x1b[5B");
test_def_val_parser!(cursor_forward, b"\x1b[5C");
test_def_val_parser!(cursor_backward, b"\x1b[5D");
test_parser!(cursor_save, b"\x1b[s");
test_parser!(cursor_restore, b"\x1b[u");

test_parser!(erase_display, b"\x1b[2J");
test_parser!(erase_line, b"\x1b[K");

test_parser!(set_video_mode_a, b"\x1b[4m");
test_parser!(set_video_mode_b, b"\x1b[4;42m");
test_parser!(set_video_mode_c, b"\x1b[4;31;42m");
test_parser!(set_video_mode_d, b"\x1b[4;31;42;42;42m");

test_parser!(reset_mode, b"\x1b[=13l");
test_parser!(set_mode, b"\x1b[=7h");

test_parser!(show_cursor, b"\x1b[?25h");
test_parser!(hide_cursor, b"\x1b[?25l");
test_parser!(cursor_to_app, b"\x1b[?1h");

test_parser!(set_newline_mode, b"\x1b[20h");
test_parser!(set_column_132, b"\x1b[?3h");
test_parser!(set_smooth_scroll, b"\x1b[?4h");
test_parser!(set_reverse_video, b"\x1b[?5h");
test_parser!(set_origin_rel, b"\x1b[?6h");
test_parser!(set_auto_wrap, b"\x1b[?7h");
test_parser!(set_auto_repeat, b"\x1b[?8h");
test_parser!(set_interlacing, b"\x1b[?9h");

test_parser!(set_cursor_key_to_cursor, b"\x1b[?1l");

test_parser!(set_linefeed, b"\x1b[20l");
test_parser!(set_vt52, b"\x1b[?2l");
test_parser!(set_col80, b"\x1b[?3l");
test_parser!(set_jump_scroll, b"\x1b[?4l");
test_parser!(set_normal_video, b"\x1b[?5l");
test_parser!(set_origin_abs, b"\x1b[?6l");
test_parser!(reset_auto_wrap, b"\x1b[?7l");
test_parser!(reset_auto_repeat, b"\x1b[?8l");
test_parser!(reset_interlacing, b"\x1b[?9l");

test_parser!(set_alternate_keypad, b"\x1b=");
test_parser!(set_numeric_keypad, b"\x1b>");
test_parser!(set_uk_g0, b"\x1b(A");
test_parser!(set_uk_g1, b"\x1b)A");
test_parser!(set_us_g0, b"\x1b(B");
test_parser!(set_us_g1, b"\x1b)B");
test_parser!(set_g0_special, b"\x1b(0");
test_parser!(set_g1_special, b"\x1b)0");
test_parser!(set_g0_alternate, b"\x1b(1");
test_parser!(set_g1_alternate, b"\x1b)1");
test_parser!(set_g0_graph, b"\x1b(2");
test_parser!(set_g1_graph, b"\x1b)2");
test_parser!(set_single_shift2, b"\x1bN");
test_parser!(set_single_shift3, b"\x1bO");

// #[test]
// fn test_parser_iterator() {
//     let count = parse_ansi(vec![b"\x1b[=25l\x1b[=7l\x1b[0m\x1b[36m\x1b[1m-`".to_vec()].into_iter())
//         .count();
// 
//     assert_eq!(count, 6);
// }
// 
// #[test]
// fn test_parser_iterator_failure() {
//     let count = parse_ansi(vec![b"\x1b[=25l\x1b[=7l\x1b[0m\x1b[36;1;15;2m\x1b[1m-`".to_vec()].into_iter())
//         .count();
// 
//     assert_eq!(count, 6);
// }
// 
// #[test]
// fn test_default_value() {
//     let strings: Vec<_> = parse_ansi(vec![b"\x1b[H\x1b[123456H\x1b[;123456H\x1b[7asd;1234H\x1b[a;sd7H".to_vec()].into_iter())
//         .collect();
//     assert_eq!(strings.len(), 5);
//     assert_eq!(strings[0], Output::Escape(AnsiSequence::CursorPos(1, 1)));
//     assert_eq!(
//         strings[1],
//         Output::Escape(AnsiSequence::CursorPos(123456, 1))
//     );
//     assert_eq!(
//         strings[2],
//         Output::Escape(AnsiSequence::CursorPos(1, 123456))
//     );
//     assert_eq!(strings[3], Output::TextBlock(Text {text: b"\x1b[7asd;1234H", location_in_text: 0}));
//     assert_eq!(strings[4], Output::TextBlock(Text {text: b"\x1b[a;sd7H", location_in_text: 0}));
// }
// // 
// // #[test]
// // fn test_escape() {
// //     let parts: Vec<_> = parse_ansi(vec![b"\x1b\x1b[33mFoobar".to_vec()].into_iter(), &vec![]).collect();
// //     assert_eq!(
// //         parts,
// //         vec![
// //             Output::Escape(AnsiSequence::Escape),
// //             Output::TextBlock("[33mFoobar")
// //         ]
// //     );
// // }
// 
