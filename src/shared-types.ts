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
    lineIndex: number;
    __html: string;
};

export type ListenToFileChunk = (event: IpcRendererEvent, chunkIndex: number, chunk: string) => void;
export type OnFileSelectedCallback = (electronEvent: IpcRendererEvent, event: FileParsedEvent | undefined) => void
export type EmptyCallbackFunction = () => void;
export type OnOpenGoToCallback = EmptyCallbackFunction
