import {IpcRendererEvent} from "electron";

type ListenToFileChunk = (event: IpcRendererEvent, chunk: string) => void;

declare global {
    interface Window {
        electron: {
            selectFile: () => Promise<void>,

            // --- Read file related ---
            preStartReadingFile(filePathToRead: string): Promise<void>,
            listenToFileChunks: (filePathToRead: string, cb: ListenToFileChunk) => void,
            cleanupFileChunkListener: (filePathToRead: string, cb: ListenToFileChunk) => void,
            startReadingFile: (filePathToRead: string) => void,
        }
    }
}
