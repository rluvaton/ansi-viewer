import {IpcRendererEvent} from "electron";

export interface FileParsedEvent {
    filePath: string,
    firstLines: Line[],
    totalLines: number,
    globalStyle: string,
}

export interface LineItem {
    className: string,
    text: string,
}

export type Line = LineItem[];


export type ListenToFileChunk = (event: IpcRendererEvent, chunkIndex: number, chunk: string) => void;
export type OnFileSelectedCallback = (electronEvent: IpcRendererEvent, event: FileParsedEvent | undefined) => void
