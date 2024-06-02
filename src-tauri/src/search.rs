use memchr::memchr;

use std::fs::File;
use std::io;
use std::io::{IoSliceMut, Read};
use std::ops::Index;

use grep::matcher::Matcher;
use grep::regex::RegexMatcher;
use grep::searcher::Searcher;
use grep::searcher::sinks::UTF8;
use crate::log_helper::measure_fn_time;

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct SearchResult {
    pub line_number: u64,
    pub column_number: usize,
}

pub fn search_file(file_path: String, query: String, slower: bool) -> Vec<SearchResult> {
    let matcher = RegexMatcher::new(query.as_str()).expect("invalid regex");
    let mut matches: Vec<SearchResult> = vec![];

    // TODO - don't panic here
    let file = File::open(file_path).expect("open file failed");

    measure_fn_time(
        "Search file",
        || Searcher::new().search_reader(
            &matcher,
            StrippedANSIFile { inner: file },
            UTF8(|lnum, line| {
                // We are guaranteed to find a match, so the unwrap is OK.
                let mymatch = matcher.find(line.as_bytes()).unwrap();

                matches.push(SearchResult {
                    line_number: lnum,
                    column_number: mymatch.unwrap().start(),
                });
                Ok(true)
            }),
        ).expect("search failed"),
    );

    println!("Matches: {:?}", matches.len());

    return matches;
}


fn remove_ansi_escape_sequences(input: &mut [u8]) -> usize {
    let mut j = 0; // Index for writing output

    let escape_code = memchr(b'\x1b', input);

    if escape_code.is_none() {
        return input.len();
    }

    let escape_code = escape_code.unwrap();
    j = escape_code;

    let end_escape_code = memchr(b'm', &input[escape_code..]);

    // Skip ANSI escape codes until 'm' or end of string
    if end_escape_code.is_none() {
        // Return the location of the escape code as the new size as if it is the first character we return 0
        // hence, no characters are written
        return j;
    }

    let end_escape_code = end_escape_code.unwrap();

    let mut end_escape_code_in_slice = end_escape_code + escape_code;

    while end_escape_code_in_slice < input.len() {
        let next_escape_code = memchr(b'\x1b', &input[end_escape_code_in_slice..]);

        if next_escape_code.is_none() {
            // move everything from after the escape code
            for i in end_escape_code_in_slice + 1..input.len() {
                input[j] = input[i];
                j += 1;
            }

            return j;
        }

        let next_escape_code = next_escape_code.unwrap();

        let next_escape_code_in_slice = next_escape_code + end_escape_code_in_slice;

        let end_escape_code_next = memchr(b'm', &input[next_escape_code_in_slice..]);

        // Skip ANSI escape codes until 'm' or end of string
        if end_escape_code_next.is_none() {
            // Return the location of the escape code as the new size as if it is the first character we return 0
            // hence, no characters are written
            // Take everything between the 2 escape codes
            for i in end_escape_code_in_slice..next_escape_code_in_slice {
                input[j] = input[i];
                j += 1;
            }

            return j;
        }

        let end_escape_code_next = end_escape_code_next.unwrap();

        let end_escape_code_next_in_slice = end_escape_code_next + next_escape_code_in_slice;

        // Move everything between the 2 escape codes
        for i in end_escape_code_in_slice + 1..next_escape_code_in_slice {
            input[j] = input[i];
            j += 1;
        }

        end_escape_code_in_slice = end_escape_code_next_in_slice;
    }

    return j;
}


struct StrippedANSIFile {
    inner: File,
}

impl Read for StrippedANSIFile {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        let result = self.inner.read(buf);

        if result.is_err() {
            return result;
        }

        let bytes_read = result.unwrap();

        let bytes_read = remove_ansi_escape_sequences(&mut buf[..bytes_read]);

        // buf[..bytes_read].copy_from_slice(new_buf);

        return Ok(bytes_read);
    }

    fn read_to_end(&mut self, buf: &mut Vec<u8>) -> io::Result<usize> {
        let result = self.inner.read_to_end(buf);

        if result.is_err() {
            return result;
        }

        let bytes_read = result.unwrap();

        let bytes_read = remove_ansi_escape_sequences(&mut buf[..bytes_read]);

        return Ok(bytes_read);
    }

}

#[cfg(test)]
mod tests {
    #[test]
    fn should_remove_ansi_escape_sequences() {
        let mut input = b"\x1b[31mHello, \x1b[32mworld!\x1b[0m".to_vec();
        let expected = b"Hello, world!".to_vec();

        let new_size = super::remove_ansi_escape_sequences(&mut input);

        input.truncate(new_size);

        let input_as_str = std::str::from_utf8(&input).unwrap();

        println!("input: {:?}", input_as_str.to_string());

        assert_eq!(input_as_str, std::str::from_utf8(&expected).unwrap());
        assert_eq!(input, expected);
        assert_eq!(new_size, expected.len());
    }

    #[test]
    fn should_remove_ansi_escape_sequences_complex() {
        let mut input = b"\x1b[31mHel\x1b[32mlo, \x1b[33mwor\x1b[34mld!\x1b[0m".to_vec();
        let expected = b"Hello, world!".to_vec();
        let new_size = super::remove_ansi_escape_sequences(&mut input);

        input.truncate(new_size);

        let input_as_str = std::str::from_utf8(&input).unwrap();

        println!("input: {:?}", input_as_str.to_string());

        assert_eq!(input_as_str, std::str::from_utf8(&expected).unwrap());
        assert_eq!(input, expected);
        assert_eq!(new_size, expected.len());
    }
}
