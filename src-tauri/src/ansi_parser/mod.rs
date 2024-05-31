// use peak_alloc::PeakAlloc;
//
// #[global_allocator]
// static PEAK_ALLOC: PeakAlloc = PeakAlloc;
extern crate clap;
extern crate core;

use crate::ansi_parser::cli::definition::get_cli;
use crate::ansi_parser::cli::mapping_file_command::run_create_mapping_file_command;
use crate::ansi_parser::cli::parse_command::run_parse_command;

pub mod parse_ansi_text;
pub mod mapping_file;
pub mod cli;
pub mod iterators;
pub mod streams_helpers;
pub mod files;
pub mod test_utils;
pub mod traits;
pub mod parse_file;
pub mod format;
pub mod output;
pub mod types;

fn run_cli() {
    let matches = get_cli().get_matches();

    let command = matches.subcommand_name().expect("Should have been able to get the command");

    if command == "parse" {
        run_parse_command(matches.subcommand_matches("parse").expect("Should have been able to get the parse subcommand"));
        return;
    }

    if command == "mapping" {
        let matches = matches.subcommand_matches("mapping").expect("Should have been able to get the mapping subcommand");

        let command = matches.subcommand_name().expect("Should have been able to get the mapping subcommand");

        if command == "create" {
            run_create_mapping_file_command(matches.subcommand_matches("create").expect("Should have been able to get the create subcommand"));
        } else {
            panic!("Unknown mapping subcommand: {}", command);
        }

        return;
    }

    panic!("Unknown command: {}", command);
}

fn main() {
    run_cli();

    // https://crates.io/crates/peak_alloc
    // let peak_mem = PEAK_ALLOC.peak_usage_as_mb();
    // println!("The max amount that was used {}", peak_mem);
}

