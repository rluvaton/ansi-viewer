import {
  EmptyCallbackFunction,
  FileParsedEvent,
  Line,
  ListenToFileChunk,
  OnFileSelectedCallback,
  OnOpenGoToCallback,
  SelectFileRequest,
} from '../../shared-types';

export async function getLines(fromLine: number): Promise<Line[]> {
  return await window.electron.getLines(fromLine);
}

export function listenToFileChunks(
  filePathToRead: string,
  cb: ListenToFileChunk,
): void {
  window.electron.listenToFileChunks(filePathToRead, cb);
}

// --- General ---
export function getWindowId(): number {
  return window.electron.getWindowId();
}

export function onSoftRefresh(cb: () => void): void {
  window.electron.onSoftRefresh(cb);
}

export function offSoftRefresh(cb: () => void): void {
  window.electron.offSoftRefresh(cb);
}

// --- File selection ---
export function selectFile(data?: SelectFileRequest): Promise<string> {
  return window.electron.selectFile(data);
}

export function onFileSelected(cb: OnFileSelectedCallback): void {
  window.electron.onFileSelected(cb);
}
export function offFileSelected(cb: OnFileSelectedCallback): void {
  window.electron.offFileSelected(cb);
}
export function windowInitialized(): void {
  window.electron.windowInitialized();
}

export async function waitForNewFile(): Promise<FileParsedEvent | undefined> {
  return await window.electron.waitForNewFile();
}

// --- Read file related ---
export function listenToFileChunks(
  filePathToRead: string,
  cb: ListenToFileChunk,
): void {
  window.electron.listenToFileChunks(filePathToRead, cb);
}

export function cleanupFileChunkListener(
  filePathToRead: string,
  cb: ListenToFileChunk,
): void {
  window.electron.cleanupFileChunkListener(filePathToRead, cb);
}

export function startReadingFile(filePathToRead: string): void {
  window.electron.startReadingFile(filePathToRead);
}

export function getLines(fromLine: number): Promise<Line[]> {
  return window.electron.getLines(fromLine);
}

export function onOpenGoTo(cb: OnOpenGoToCallback): void {
  window.electron.onOpenGoTo(cb);
}

export function offOpenGoTo(cb: OnOpenGoToCallback): void {
  window.electron.offOpenGoTo(cb);
}

export function onHighlightCaretPosition(cb: EmptyCallbackFunction): void {
  window.electron.onHighlightCaretPosition(cb);
}

export function offHighlightCaretPosition(cb: EmptyCallbackFunction): void {
  window.electron.offHighlightCaretPosition(cb);
}
