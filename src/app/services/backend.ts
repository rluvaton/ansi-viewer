import { fs, dialog, invoke, window } from '@tauri-apps/api';
import {
  EmptyCallbackFunction,
  FileParsedEvent,
  Line,
  ListenToFileChunk,
  OnFileSelectedCallback,
  OnOpenGoToCallback,
  SelectFileRequest,
} from '../../shared-types';
import { LINES_BLOCK_SIZE } from '../../shared/constants';
import { getContainer } from '../stores/stores-container';

// --- General ---
export function getWindowId(): string {
  return window.appWindow.label;
  // return window.electron.getWindowId().toString();
}

export function onSoftRefresh(cb: () => void): void {
  console.log('onSoftRefresh');
  // window.electron.onSoftRefresh(cb);
}

export function offSoftRefresh(cb: () => void): void {
  console.log('offSoftRefresh');
  // window.electron.offSoftRefresh(cb);
}

// --- File selection ---

export async function selectFile(
  data?: SelectFileRequest,
): Promise<FileParsedEvent | null> {
  let selectedFilePath = data?.filePath;

  if (!selectedFilePath) {
    selectedFilePath = await dialog.open({
      multiple: false,
      directory: false,
      title: 'Select a file to view',

      // TODO - remove this
      defaultPath: '/Users/rluvaton/dev/personal/ansi-viewer/examples',
    });

    if (!selectedFilePath) {
      return null;
    }
    // TODO - still send backend request that file selected
    // return data.filePath;
  }

  // TODO - assert file selected

  // TODO - notify the backend that a file was selected

  return await invoke('open_file', { filePath: selectedFilePath });

  // return selectedFilePath as string;
  // return window.electron.selectFile(data);
}

export function onFileSelected(cb: OnFileSelectedCallback): void {
  console.log('onFileSelected');
  // window.electron.onFileSelected(cb);
}
export function offFileSelected(cb: OnFileSelectedCallback): void {
  console.log('offFileSelected');
  // window.electron.offFileSelected(cb);
}
export function windowInitialized(): void {
  console.log('windowInitialized');
  // window.electron.windowInitialized();
}

export async function waitForNewFile(): Promise<FileParsedEvent | undefined> {
  console.log('waitForNewFile');
  // return await window.electron.waitForNewFile();
}

// --- Read file related ---
export function listenToFileChunks(
  filePathToRead: string,
  cb: ListenToFileChunk,
): void {
  console.log('listenToFileChunks');
  // window.electron.listenToFileChunks(filePathToRead, cb);
}

export function cleanupFileChunkListener(
  filePathToRead: string,
  cb: ListenToFileChunk,
): void {
  console.log('cleanupFileChunkListener');
  // window.electron.cleanupFileChunkListener(filePathToRead, cb);
}

export function startReadingFile(filePathToRead: string): void {
  console.log('startReadingFile');
  // window.electron.startReadingFile(filePathToRead);
}

export function getLines(
  fromLine: number,
  mappingFilePath?: string,
): Promise<Line[]> {
  console.log('getLines');
  return invoke('get_lines', {
    filePath: getContainer().fileSelectorStore.currentFilePath,
    fromLine,
    toLine: fromLine + LINES_BLOCK_SIZE,
    mappingFilePath,
  });
  // return window.electron.getLines(fromLine);
}

export function onOpenGoTo(cb: OnOpenGoToCallback): void {
  console.log('onOpenGoTo');
  // window.electron.onOpenGoTo(cb);
}

export function offOpenGoTo(cb: OnOpenGoToCallback): void {
  console.log('offOpenGoTo');
  // window.electron.offOpenGoTo(cb);
}

export function onHighlightCaretPosition(cb: EmptyCallbackFunction): void {
  console.log('onHighlightCaretPosition');
  // window.electron.onHighlightCaretPosition(cb);
}

export function offHighlightCaretPosition(cb: EmptyCallbackFunction): void {
  console.log('offHighlightCaretPosition');
  // window.electron.offHighlightCaretPosition(cb);
}
