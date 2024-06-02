import { fs, dialog, invoke, window } from '@tauri-apps/api';
import { UnlistenFn, listen } from '@tauri-apps/api/event';
import { Event } from '@tauri-apps/api/helpers/event';
import {
  EmptyCallbackFunction,
  FileParsedEvent,
  GetLinesInBlocksPayload,
  GetLinesPayload,
  Line,
  ListenToFileChunk,
  MappingFileCreatedEvent,
  OnFileSelectedCallback,
  OnMappingFileCreatedCallback,
  OnOpenGoToCallback,
  SelectFileRequest,
} from '../../shared-types';
import { LINES_BLOCK_SIZE } from '../../shared/constants';
import { getContainer } from '../stores/stores-container';

const listenersToUnlistenPromises = new WeakMap<
  (...args: unknown[]) => any,
  Promise<UnlistenFn>
>();

// --- General ---
export function getWindowId(): string {
  return window.appWindow.label;
  // return window.electron.getWindowId().toString();
}

export function onSoftRefresh(_cb: () => void): void {
  console.log('onSoftRefresh');
  // window.electron.onSoftRefresh(cb);
}

export function offSoftRefresh(_cb: () => void): void {
  console.log('offSoftRefresh');
  // window.electron.offSoftRefresh(cb);
}

// --- File selection ---

export async function selectFile(
  data?: SelectFileRequest,
): Promise<FileParsedEvent | null> {
  let selectedFilePath = data?.filePath;

  if (!selectedFilePath) {
    const selectedFilePathResult = await dialog.open({
      multiple: false,
      directory: false,
      title: 'Select a file to view',

      // TODO - remove this
      defaultPath: '/Users/rluvaton/dev/personal/ansi-viewer/examples',
    });

    if (!selectedFilePathResult) {
      return null;
    }

    selectedFilePath = selectedFilePathResult as string;
    // TODO - still send backend request that file selected
    // return data.filePath;
  }

  // TODO - assert file selected

  // TODO - notify the backend that a file was selected

  return await invoke('open_file', { filePath: selectedFilePath });

  // return selectedFilePath as string;
  // return window.electron.selectFile(data);
}

export function onFileSelected(_cb: OnFileSelectedCallback): void {
  console.log('onFileSelected');
  // window.electron.onFileSelected(cb);
}

export function offFileSelected(_cb: OnFileSelectedCallback): void {
  console.log('offFileSelected');
  // window.electron.offFileSelected(cb);
}

export function windowInitialized(): void {
  console.log('windowInitialized');
  // window.electron.windowInitialized();
}
//
// export async function waitForNewFile(): Promise<FileParsedEvent | undefined> {
//   console.log('waitForNewFile');
//   // return await window.electron.waitForNewFile();
// }

// --- Read file related ---
export function listenToFileChunks(
  _filePathToRead: string,
  _cb: ListenToFileChunk,
): void {
  console.log('listenToFileChunks');
  // window.electron.listenToFileChunks(filePathToRead, cb);
}

export function cleanupFileChunkListener(
  _filePathToRead: string,
  _cb: ListenToFileChunk,
): void {
  console.log('cleanupFileChunkListener');
  // window.electron.cleanupFileChunkListener(filePathToRead, cb);
}

export function startReadingFile(_filePathToRead: string): void {
  console.log('startReadingFile');
  // window.electron.startReadingFile(filePathToRead);
}

export function getLines(
  fromLine: number,
  toLine: number,
  mappingFilePath?: string,
): Promise<Line[]> {
  console.log('getLines');
  return invoke('get_lines', {
    data: {
      file_path: getContainer().fileSelectorStore.currentFilePath,
      from_line: Math.max(fromLine, 1),
      to_line: toLine,
      mapping_file_path: mappingFilePath,
    } satisfies GetLinesPayload,
  });
  // return window.electron.getLines(fromLine);
}

export function getLinesInBlocks(
  fromLine: number,
  toLine: number,
  mappingFilePath?: string,
): Promise<Line[][]> {
  console.log('getLinesInBlocks');
  return invoke('get_lines_in_blocks', {
    data: {
      file_path: getContainer().fileSelectorStore.currentFilePath,
      from_line: Math.max(fromLine, 1),
      to_line: toLine,
      mapping_file_path: mappingFilePath,
      block_size: LINES_BLOCK_SIZE,
    } satisfies GetLinesInBlocksPayload,
  });
}

export function onOpenGoTo(_cb: OnOpenGoToCallback): void {
  console.log('onOpenGoTo');
  // window.electron.onOpenGoTo(cb);
}

export function offOpenGoTo(_cb: OnOpenGoToCallback): void {
  console.log('offOpenGoTo');
  // window.electron.offOpenGoTo(cb);
}

export function onHighlightCaretPosition(_cb: EmptyCallbackFunction): void {
  console.log('onHighlightCaretPosition');
  // window.electron.onHighlightCaretPosition(cb);
}

export function offHighlightCaretPosition(_cb: EmptyCallbackFunction): void {
  console.log('offHighlightCaretPosition');
  // window.electron.offHighlightCaretPosition(cb);
}

export function onMappingFileCreated(cb: OnMappingFileCreatedCallback): void {
  console.log('onMappingFileCreated');

  const unlisten = listen(
    'mapping-file-created',
    function wrapper(event: Event<MappingFileCreatedEvent>) {
      return cb(event.payload);
    },
  );

  listenersToUnlistenPromises.set(cb, unlisten);
}

export function offMappingFileCreated(cb: OnMappingFileCreatedCallback): void {
  console.log('offMappingFileCreated');

  const unlistenPromise = listenersToUnlistenPromises.get(cb);
  if (unlistenPromise) {
    unlistenPromise.then((unlisten) => unlisten());
  }
}

export async function removeMappingFile(
  mappingFilePath: string,
): Promise<void> {
  return await invoke('remove_mapping_file', { mappingFilePath });
}
