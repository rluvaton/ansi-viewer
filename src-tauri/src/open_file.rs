use std::fs::File;
use std::io::{BufRead, BufReader};
use ansi_parser_extended::files::file_reader::FileReaderOptions;
use ansi_parser_extended::parse_ansi_text::parse_options::ParseOptions;
use ansi_parser_extended::parse_file::file_to_lines_of_spans::read_ansi_file_to_lines;
use ansi_parser_extended::parse_file::types::ReadAnsiFileOptions;

use crate::serialize_to_client::{create_line_from_spans, FileParsed, Line};

pub fn open_file_cmd(file_path: String) -> Option<FileParsed> {
    /**
    ```ts
    logger.info('openFilePath', { filePath, requestedFromClient });
    if (!filePath) {
      logger.warn('no file selected');
      window.webContents.send('file-selected', filePath);
      window.webContents.send('file-parsed', undefined);
      return undefined;
    }

    logger.info('file path exists', { filePath, requestedFromClient });

    window.setRepresentedFilename(filePath);

    // Just to let the renderer know that the file was selected
    window.webContents.send('file-selected', filePath);

    const parsed = await runFnAndLogDuration({
      name: 'parse file',
      fn: () => OpenedFileState.parseNewFile(window, filePath),
      logArgs: { filePath },
    });

    const fileParsedEvent = runFnAndLogDuration({
      name: 'Create file parsed event',
      fn: () =>
        ({
          filePath,
          totalLines: parsed.totalLines,
          firstLines: parsed.getLinesSync(0),
          globalStyle: parsed.commonStyle,
          requestedFromClient,
        }) satisfies FileParsedEvent,
      logArgs: { filePath },
    });
    window.webContents.send('file-parsed', fileParsedEvent);

    return filePath;
    ```
     */

//     logger.info('openFilePath', { filePath, requestedFromClient });

//     if !file_path.clone() {
//         //       logger.warn('no file selected');
// //       window.webContents.send('file-selected', filePath);
// //       window.webContents.send('file-parsed', undefined);
// //       return undefined;
//         return None;
//     }

//
//     logger.info('file path exists', { filePath, requestedFromClient });
//
//     window.setRepresentedFilename(filePath);
//
//     // Just to let the renderer know that the file was selected
//     window.webContents.send('file-selected', filePath);
//
//     const parsed = await runFnAndLogDuration({
//       name: 'parse file',
//       fn: () => OpenedFileState.parseNewFile(window, filePath),
//       logArgs: { filePath },
//     });
//     let parsed = OpenedFileState.parseNewFile(window, filePath);
//
//     const fileParsedEvent = runFnAndLogDuration({
//       name: 'Create file parsed event',
//       fn: () =>
//         ({
//           filePath,
//           totalLines: parsed.totalLines,
//           firstLines: parsed.getLinesSync(0),
//           globalStyle: parsed.commonStyle,
//           requestedFromClient,
//         }) satisfies FileParsedEvent,
//       logArgs: { filePath },
//     });
//     window.webContents.send('file-parsed', fileParsedEvent);

    return Some(FileParsed {
        filePath: file_path.clone(),
//           totalLines: parsed.totalLines,
        totalLines: get_number_of_lines(file_path.as_str()),
//           firstLines: parsed.getLinesSync(0),
        firstLines: get_lines_sync(file_path.as_str()),
        // globalStyle: parsed.commonStyle,
        globalStyle: "".to_string(),
        requestedFromClient: true,
    });
//
//     return filePath;
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

