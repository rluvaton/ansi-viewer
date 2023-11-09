import {IpcRendererEvent} from "electron";

export interface FileParsedEvent {
    filePath: string,
    firstLines: Line[],
    totalLines: number,
    globalStyle: string,
    requestedFromClient: boolean,
}

export interface LineItem {
    className: string,
    text: string,
}

export type Line = {
    items: LineItem[],
    lineIndex: number,
};

export type ListenToFileChunk = (event: IpcRendererEvent, chunkIndex: number, chunk: string) => void;
export type OnFileSelectedCallback = (electronEvent: IpcRendererEvent, event: FileParsedEvent | undefined) => void
