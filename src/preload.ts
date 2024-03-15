// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {contextBridge, ipcRenderer} from "electron";
import {FileParsedEvent, Line, OnFileSelectedCallback, SearchLocation, SearchResult} from "./shared-types";

contextBridge.exposeInMainWorld('electron', {
    // --- General ---
    getWindowId: () => ipcRenderer.sendSync('get-window-id'),
    windowInitialized: () => ipcRenderer.sendSync('window-initialized'),
    onSoftRefresh: (cb: () => void) => ipcRenderer.on('soft-refresh', cb),
    offSoftRefresh: (cb: () => void) => ipcRenderer.off('soft-refresh', cb),

    // --- File selection ---
    selectFile: () => ipcRenderer.invoke('select-file'),

    // From menu bar or keyboard shortcut
    onFileSelected: (cb: OnFileSelectedCallback) => ipcRenderer.on('file-parsed', cb),
    offFileSelected: (cb: OnFileSelectedCallback) => ipcRenderer.off('file-parsed', cb),

    waitForNewFile(): Promise<FileParsedEvent | undefined> {
        return new Promise((resolve) => {
            ipcRenderer.once('file-parsed', (_, fileParsedEventData: FileParsedEvent) => resolve(fileParsedEventData));
        });
    },

    // --- Read file related ---
    getLines(fromLine: number): Promise<Line[]> {
        // TODO - should we use invoke instead? so it will not block the main thread?
        return ipcRenderer.invoke('get-lines', fromLine);
    },
    // listenToFileChunks: (filePathToRead: string, cb: ListenToFileChunk) => ipcRenderer.on(`read-file-stream-${filePathToRead}`, cb),
    // cleanupFileChunkListener: (filePathToRead: string, cb: ListenToFileChunk) => ipcRenderer.off(`read-file-stream-${filePathToRead}`, cb),
    // startReadingFile: (filePathToRead: string) => ipcRenderer.send('read-file-stream', filePathToRead),

    // --- Search related ---
    searchInFile: (search: string): Promise<SearchResult[]> => ipcRenderer.invoke('search-in-file', search),
});
