import {IpcRendererEvent} from "electron";

type ListenToFileChunk = (event: IpcRendererEvent, chunkIndex: number, chunk: string) => void;

declare global {
    interface Window {
        electron: {
            // --- General ---
            getWindowId(): number,
            onSoftRefresh(cb: () => void): void,
            offSoftRefresh(cb: () => void): void,

            // --- File selection ---
            selectFile(): Promise<string>,

            onFileSelected(cb: (event: IpcRendererEvent, selectedFilePath: string) => void): void,
            offFileSelected(cb: (event: IpcRendererEvent, selectedFilePath: string) => void): void,

            // --- Read file related ---
            listenToFileChunks(filePathToRead: string, cb: ListenToFileChunk): void,
            cleanupFileChunkListener(filePathToRead: string, cb: ListenToFileChunk): void,
            startReadingFile(filePathToRead: string): void,
        }
    }
}
