// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {contextBridge, ipcRenderer} from "electron";
import IpcRendererEvent = Electron.IpcRendererEvent;

type ListenToFileChunk = (event: IpcRendererEvent, chunk: string) => void;

contextBridge.exposeInMainWorld('electron', {
    selectFile: () => ipcRenderer.invoke('select-file'),

    // --- Read file related ---
    preStartReadingFile: (filePathToRead: string) => ipcRenderer.invoke('pre-start-reading-file', filePathToRead),
    listenToFileChunks: (filePathToRead: string, cb: ListenToFileChunk) => ipcRenderer.on(`read-file-stream-${filePathToRead}`, cb),
    cleanupFileChunkListener: (filePathToRead: string, cb: ListenToFileChunk) => ipcRenderer.off(`read-file-stream-${filePathToRead}`, cb),
    startReadingFile: (filePathToRead: string) => ipcRenderer.send('read-file-stream', filePathToRead),
});
