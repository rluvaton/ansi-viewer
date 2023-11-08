import {dialog, ipcMain} from "electron";
import * as fs from "node:fs/promises";
import {createReadStream} from "node:fs";
import {getWindowFromEvent} from "./helper";

// TODO - listen for scroll events/search and send them to the renderer

export async function selectFile() {
    let selectedFilePath: string;
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            // TODO - remove this
            defaultPath: '/Users/rluvaton/dev/personal/ansi-viewer/examples'
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

    await assertFileAccessible(selectedFilePath);

    return selectedFilePath;
}

async function assertFileAccessible(filePath: string) {
    // Make sure the path:
    // - exists
    // - a file
    // - have read access

    if (!filePath) {
        throw new Error('no file path provided');
    }

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

ipcMain.handle('select-file', selectFile);

ipcMain.on('read-file-stream', async (event, filePath) => {
    console.log('read-file-stream', filePath);

    getWindowFromEvent(event)?.setRepresentedFilename(filePath);

    const eventNameForFileStreamChunks = `read-file-stream-${filePath}`

    // TODO
    //  - add back pressure
    //  - if no ping than clean up so we don't have memory leak
    //  - add error handling
    //  - add cancellation
    //  - soft refresh should cancel the current file read

    const stream = createReadStream(filePath)
    try {
        let index = 0;
        for await (const chunk of stream) {
            event.sender.send(eventNameForFileStreamChunks, index, chunk.toString());
            index++;
        }

        console.log('finish')
        event.sender.send(eventNameForFileStreamChunks, index, null)
    } catch (e) {
        console.error('failed to read file', e)
        // TODO - send error
        event.sender.send(eventNameForFileStreamChunks, null)
    }
})
