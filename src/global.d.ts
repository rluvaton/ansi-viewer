import {
  EmptyCallbackFunction,
  FileParsedEvent,
  Line,
  ListenToFileChunk,
  OnFileSelectedCallback,
  OnOpenGoToCallback,
  SearchLocation,
  SearchResult,
} from './shared-types';

declare global {
  interface Window {
    electron: {
      // --- General ---
      getWindowId(): number;
      onSoftRefresh(cb: () => void): void;
      offSoftRefresh(cb: () => void): void;

      // --- File selection ---
      selectFile(): Promise<string>;

      onFileSelected(cb: OnFileSelectedCallback): void;
      windowInitialized(): void;
      offFileSelected(cb: OnFileSelectedCallback): void;
      waitForNewFile(): Promise<FileParsedEvent | undefined>;

      // --- Read file related ---
      listenToFileChunks(filePathToRead: string, cb: ListenToFileChunk): void;
      cleanupFileChunkListener(
        filePathToRead: string,
        cb: ListenToFileChunk,
      ): void;
      startReadingFile(filePathToRead: string): void;
      getLines(fromLine: number): Promise<Line[]>;

      onOpenGoTo(cb: OnOpenGoToCallback): void;
      offOpenGoTo(cb: OnOpenGoToCallback): void;

      onHighlightCaretPosition(cb: EmptyCallbackFunction): void;
      offHighlightCaretPosition(cb: EmptyCallbackFunction): void;

      // --- Search related ---
      onOpenSearch(cb: EmptyCallbackFunction): void;
      offOpenSearch(cb: EmptyCallbackFunction): void;

      searchInFile(search: string): Promise<SearchResult[]>;
    };
  }
}
