import { createReadStream } from 'node:fs';
import * as fs from 'node:fs/promises';
import { BrowserWindow, dialog, ipcMain } from 'electron';
import prettyBytes from 'pretty-bytes';
import { FileParsedEvent, SearchResult } from '../shared-types';
import { OpenedFileState } from './ansi-file/open-file-state';
import { ParsedFileState } from './ansi-file/parsed-ansi-file';
import { getWindowFromEvent } from './helper';

// TODO - listen for scroll events/search and send them to the renderer

let counter = 0;

async function selectFile() {
  let selectedFilePath: string;
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      // TODO - remove this
      defaultPath: '/Users/rluvaton/dev/personal/ansi-viewer/examples',
    });
    if (result.canceled) {
      console.log('canceled');
      return undefined;
    }

    selectedFilePath = result.filePaths[0];
  } catch (err) {
    console.error('Failed to get file', err);
    return undefined;
  }

  if (!selectedFilePath) {
    return undefined;
  }

  await assertFileAccessible(selectedFilePath);

  return selectedFilePath;
}

async function assertFileAccessible(filePath: string) {
  // Make sure the path:
  // - exists
  // - a file
  // - have read access

  let fileStats;

  try {
    fileStats = await fs.stat(filePath);
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw new Error('file not found');
    }

    console.error('failed to get file stats', e);
    throw new Error('Failed to get file');
  }

  if (!fileStats.isFile()) {
    throw new Error('not a file');
  }

  try {
    await fs.access(filePath, fs.constants.R_OK);
  } catch (e) {
    throw new Error('Access denied');
  }
}

ipcMain.handle('select-file', async (event) => {
  return await openFile(getWindowFromEvent(event), true);
});

// ipcMain.on('read-file-stream', async (event, filePath) => {
//     console.log('read-file-stream', filePath);
//
//     getWindowFromEvent(event)?.setRepresentedFilename(filePath);
//
//     const eventNameForFileStreamChunks = `read-file-stream-${filePath}`
//
//     // TODO
//     //  - add back pressure
//     //  - if no ping than clean up so we don't have memory leak
//     //  - add error handling
//     //  - add cancellation
//     //  - soft refresh should cancel the current file read
//
//     const stream = createReadStream(filePath)
//     try {
//         let index = 0;
//         for await (const chunk of stream) {
//             event.sender.send(eventNameForFileStreamChunks, index, chunk.toString());
//             index++;
//         }
//
//         console.log('finish')
//         event.sender.send(eventNameForFileStreamChunks, index, null)
//     } catch (e) {
//         console.error('failed to read file', e)
//         // TODO - send error
//         event.sender.send(eventNameForFileStreamChunks, null)
//     }
// })

export async function openFile(
  window: BrowserWindow,
  requestedFromClient: boolean,
) {
  const filePath = await selectFile();

  if (!filePath) {
    window.webContents.send('file-selected', filePath);
    window.webContents.send('file-parsed', undefined);
    return undefined;
  }

  window.setRepresentedFilename(filePath);

  // Just to let the renderer know that the file was selected
  window.webContents.send('file-selected', filePath);

  console.time('openFile: parse file');
  const parsed = await OpenedFileState.parseNewFile(window, filePath);
  console.timeEnd('openFile: parse file');

  window.webContents.send('file-parsed', {
    filePath,
    totalLines: parsed.totalLines,
    firstLines: parsed.getLinesSync(0),
    globalStyle: parsed.commonStyle,
    requestedFromClient,
  } satisfies FileParsedEvent);

  return filePath;
}

ipcMain.handle('get-lines', async (event, fromLineNumber) => {
  const window = getWindowFromEvent(event);

  const parsed = ParsedFileState.getOpenedFileState(window);

  if (!parsed) {
    throw new Error('No file opened');
  }

  const currentNum = counter++;
  console.time(`get lines ${currentNum}`);
  const requestedLines = await parsed.getLines(fromLineNumber);
  console.timeEnd(`get lines ${currentNum}`);

  return requestedLines;
});

ipcMain.handle(
  'search-in-file',
  async (event, search: string): Promise<SearchResult[]> => {
    // TODO - abort previous search if it's still running

    const window = getWindowFromEvent(event);

    const parsed = ParsedFileState.getOpenedFileState(window);

    if (!parsed) {
      throw new Error('No file opened');
    }

    console.time(`search ${search}`);
    const results = await parsed.search(search);
    console.timeEnd(`search ${search}`);

    console.log(`Found ${results.length} results for ${search}`);

    return results;
  },
);
//
// setInterval(() => {
//     console.log(
//         'Memory usage',
//         Object.fromEntries(
//             Object.entries(process.memoryUsage())
//                 .map(([key, value]) => [key, prettyBytes(value)])
//         )
//     );
// }, 1000);
