// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electron', {
    getSelectedPath: () => ipcRenderer.invoke('select-file'),

    // --- Read file related ---
    preStartReadingFile: (filePathToRead) => ipcRenderer.invoke('pre-start-reading-file', filePathToRead),
    listenToFileChunks: (filePathToRead, cb) => ipcRenderer.on(`read-file-stream-${filePathToRead}`, cb),
    cleanupFileChunkListener: (filePathToRead, cb) => ipcRenderer.off(`read-file-stream-${filePathToRead}`, cb),
    startReadingFile: (filePathToRead) => ipcRenderer.send('read-file-stream', filePathToRead),
});
