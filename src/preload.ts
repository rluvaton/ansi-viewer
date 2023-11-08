// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {contextBridge, ipcRenderer} from "electron";
import IpcRendererEvent = Electron.IpcRendererEvent;

type ListenToFileChunk = (event: IpcRendererEvent, chunkIndex: number, chunk: string) => void;

contextBridge.exposeInMainWorld('electron', {
    // --- General ---
    getWindowId: () => ipcRenderer.sendSync('get-window-id'),
    onSoftRefresh: (cb: () => void) => ipcRenderer.on('soft-refresh', cb),
    offSoftRefresh: (cb: () => void) => ipcRenderer.off('soft-refresh', cb),

    // --- File selection ---
    selectFile: () => ipcRenderer.invoke('select-file'),

    // From menu bar or keyboard shortcut
    onFileSelected: (cb: (event: IpcRendererEvent, selectedFilePath: string) => void) => ipcRenderer.on('file-selected', cb),
    offFileSelected: (cb: (event: IpcRendererEvent, selectedFilePath: string) => void) => ipcRenderer.off('file-selected', cb),

    // --- Read file related ---
    listenToFileChunks: (filePathToRead: string, cb: ListenToFileChunk) => ipcRenderer.on(`read-file-stream-${filePathToRead}`, cb),
    cleanupFileChunkListener: (filePathToRead: string, cb: ListenToFileChunk) => ipcRenderer.off(`read-file-stream-${filePathToRead}`, cb),
    startReadingFile: (filePathToRead: string) => ipcRenderer.send('read-file-stream', filePathToRead),
});
