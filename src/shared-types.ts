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

export type SearchLocation = {
    line: number,
    column: number,
    // Index of the text in the whole string
    position: number
}

export type SearchResult = {
    start: SearchLocation,
    end: SearchLocation
};


