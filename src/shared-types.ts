import { IpcRendererEvent } from 'electron';

export interface FileParsedEvent {
  file_path: string;
  first_lines: Line[];
  total_lines: number;
  global_style: string;
  requested_from_client: boolean;
}

export interface MappingFileCreatedEvent {
  file_path: string;
  mapping_file_path: string;
}

export interface LineItem {
  className: string;
  text: string;
}

export type Line = {
  line_index: number;
  __html: string;
};

export type ListenToFileChunk = (
  event: IpcRendererEvent,
  chunkIndex: number,
  chunk: string,
) => void;
export type OnFileSelectedCallback = (
  electronEvent: IpcRendererEvent,
  event: FileParsedEvent | undefined,
) => void;
export type EmptyCallbackFunction = () => void;
export type OnOpenGoToCallback = EmptyCallbackFunction;

export interface SelectFileRequest {
  // This is optional and used in the tests when can't use the dialog
  filePath?: string;
}

export type OnMappingFileCreatedCallback = (
  event: MappingFileCreatedEvent,
) => void;
