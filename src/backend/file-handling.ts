import {BrowserWindow, dialog, ipcMain} from "electron";
import * as fs from "node:fs/promises";
import {createReadStream} from "node:fs";
import {getWindowFromEvent} from "./helper";
import {OpenedFileState} from "./ansi-file/open-file-state";
import {ParsedFileState} from "./ansi-file/parsed-ansi-file";
import {FileParsedEvent} from "../shared-types";
import prettyBytes from "pretty-bytes";

let counter = 0;

async function selectFile() {
    let selectedFilePath: string;
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            defaultPath: process.env.NODE_ENV !== 'production' ? '/Users/rluvaton/dev/personal/ansi-viewer/examples' : undefined
        });
        if (result.canceled) {
            console.log('canceled');
            return undefined;
        }

        selectedFilePath = result.filePaths[0];
    } catch (err) {
        console.error('Failed to get file', err);
        return undefined
    }

    if (!selectedFilePath) {
        return undefined;
    }

    await assertFileAccessible(selectedFilePath);

    return selectedFilePath;
}

async function assertFileAccessible(filePath: string) {
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

export async function openFile(window: BrowserWindow, requestedFromClient: boolean) {
    const filePath = await selectFile();

    if (!filePath) {
        window.webContents.send('file-selected', filePath);
        window.webContents.send('file-parsed', undefined);
        return undefined;
    }

    window.setRepresentedFilename(filePath);

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

    const parsed = ParsedFileState.getOpenedFileState(window)

    if (!parsed) {
        throw new Error('No file opened');
    }

    const currentNum = counter++;
    console.time(`get lines ${currentNum}`);
    const requestedLines = await parsed.getLines(fromLineNumber);
    console.timeEnd(`get lines ${currentNum}`);

    return requestedLines;
});

// New IPC event handler for search queries
ipcMain.handle('search-in-file', async (event, query) => {
    const window = getWindowFromEvent(event);
    const parsed = ParsedFileState.getOpenedFileState(window);

    if (!parsed) {
        throw new Error('No file opened');
    }

    // Implement search logic here
    // This is a placeholder for the actual search implementation
    const searchResults = []; // Placeholder for search results

    // Emit search results back to the renderer process
    event.sender.send('search-results', searchResults);
});
