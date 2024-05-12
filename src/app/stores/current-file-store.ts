import { action, makeObservable, observable } from 'mobx';
import React from 'react';
import { FileParsedEvent, Line } from '../../shared-types';
import { LINES_BLOCK_SIZE } from '../../shared/constants';
import { LinesStorage } from '../lines-storage';
import { getContainer } from './stores-container';

type CurrentFileState = 'idle' | 'reading' | 'read' | 'error';

export class CurrentFileStore {
  fileContent: string | undefined;
  currentFileState: CurrentFileState = 'idle';

  listRef: React.RefObject<HTMLDivElement>;

  commonStyleElement: HTMLStyleElement;
  linesStorage: LinesStorage = new LinesStorage(10);
  totalLines = 0;
  linesRerenderKey = 0;

  resetAbortController: AbortController = new AbortController();

  constructor() {
    makeObservable(this, {
      currentFileState: observable,
      fileContent: observable,
      linesRerenderKey: observable,
      reset: action,
      selectFile: action,
      setAsReading: action,
      loadMoreLines: action,
    });

    this.commonStyleElement = document.querySelector(
      'style#common-style',
    ) as HTMLStyleElement;
  }

  registerList(ref: React.RefObject<HTMLDivElement>) {
    this.listRef = ref;
  }

  unregisterList() {
    this.listRef = null;
  }

  reset() {
    this.resetAbortController.abort();
    this.resetAbortController = new AbortController();
    this.currentFileState = 'idle';
    this.fileContent = undefined;
    this.linesStorage.reset();

    // TODO - maybe move this to the search store that it will listen to some change?
    getContainer().searchActionStore.clearHighlights();
  }

  selectFile(event: FileParsedEvent, resetBefore = false) {
    if (resetBefore) {
      this.reset();
    } else {
      this.linesStorage.reset();
    }

    this.linesStorage.addLines(event.firstLines);
    this.totalLines = event.totalLines;
    this.currentFileState = 'read';
    this.linesRerenderKey++;
    this.commonStyleElement.innerHTML = event.globalStyle;
  }

  async reselectSameFile(filePath: string) {
    this.selectFile(
      {
        filePath,
        firstLines: await window.electron.getLines(0),
        totalLines: this.totalLines,
        globalStyle: this.commonStyleElement.innerHTML,
        requestedFromClient: true,
      },
      true,
    );
  }

  private async *readFileIterator(filePathToRead: string) {
    console.log('start reading file', filePathToRead);
    this.setAsReading();

    // Promise to wait for the next value to be ready
    let resolve: (value: void) => void;
    let reject: (reason?: any) => void;
    let promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    // Values that pile up until the iterator is ready to consume them
    const values: string[] = [];
    const valuesOutOfOrder: { index: number; value: string }[] = [];
    let currentChunkIndex = -1;

    let timeoutTimer: NodeJS.Timeout;

    function fileStreamChunkListener(
      _: unknown,
      chunkIndex: number,
      chunk: string,
    ) {
      clearTimeout(timeoutTimer);

      timeoutTimer = setTimeout(() => {
        const timeoutError = new Error(
          `Timeout while reading file ${filePathToRead}`,
        );
        console.error(timeoutError.message, {
          values: [...values],
          valuesOutOfOrder: [...valuesOutOfOrder],
          currentChunkIndex,
          error: timeoutError,
        });
        reject(timeoutError);
      }, 5000);

      if (chunkIndex < currentChunkIndex + 1) {
        // We already read this chunk, ignore it
        return;
      }

      // We can receive chunks in the wrong order that was sent, so we need to sort them
      if (chunkIndex === currentChunkIndex + 1) {
        currentChunkIndex++;
        values.push(chunk);

        while (
          valuesOutOfOrder.length > 0 &&
          valuesOutOfOrder[0].index === currentChunkIndex + 1
        ) {
          currentChunkIndex++;
          values.push(valuesOutOfOrder.shift()?.value);
        }

        // TODO - handle errors and back-pressure
        resolve();
      } else {
        valuesOutOfOrder.push({ index: chunkIndex, value: chunk });

        // Sort by index
        valuesOutOfOrder.sort((a, b) => a.index - b.index);
      }
    }

    // Attach the listener before reading the file to avoid missing data
    window.electron.listenToFileChunks(filePathToRead, fileStreamChunkListener);
    window.electron.startReadingFile(filePathToRead);

    function onAbort() {
      reject('Aborted');
    }

    this.resetAbortController.signal.addEventListener('abort', onAbort, {
      once: true,
    });

    try {
      while (true) {
        // Waiting for the next value to be ready
        await promise;

        // Reset the promise for the next value
        promise = new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        });

        // Copy the values to a new array and clear the original so we won't re-read them
        const valuesCopy = [...values];
        values.length = 0;

        // Yield the values
        for (const value of valuesCopy) {
          // null means we reached the end of the file
          if (value === null) {
            return;
          }

          yield value;
        }
      }
    } finally {
      clearTimeout(timeoutTimer);
      window.electron.cleanupFileChunkListener(
        filePathToRead,
        fileStreamChunkListener,
      );
      this.resetAbortController.signal.removeEventListener('abort', onAbort);
    }
  }

  setAsReading() {
    this.currentFileState = 'reading';
  }

  setErrorWhileReadingFile(filePath: string, error: unknown) {
    // TODO - add toast
    console.error(`Error while reading file ${filePath}`, error);
    this.currentFileState = 'error';
    this.fileContent = undefined;
  }

  isLineNumberLoaded = (lineNumber: number) => {
    // TODO - implement by asking the backend if read that line synchronously
    return (
      this.currentFileState === 'read' &&
      lineNumber < this.totalLines &&
      this.linesStorage.isLineExists(lineNumber)
    );
  };

  loadMoreLines = async (startLineNumber: number, endLineNumber: number) => {
    if (startLineNumber >= this.totalLines) {
      return;
    }

    if (endLineNumber >= this.totalLines) {
      endLineNumber = this.totalLines - 1;
    }

    // TODO - support endLineNumber in backend
    const numberOfBlocks = Math.ceil(
      (endLineNumber - startLineNumber) / LINES_BLOCK_SIZE,
    );

    console.log(`Load more lines from: ${startLineNumber} to ${endLineNumber}`);

    this.linesStorage.addBlocks(
      await Promise.all(
        Array.from({ length: numberOfBlocks }, (_, i) =>
          window.electron.getLines(startLineNumber + i * LINES_BLOCK_SIZE),
        ),
      ),
    );
  };

  // the generated class name is the one that in the common style, style element
  getLine(lineNumber: number): Line | undefined {
    return this.linesStorage.getLine(lineNumber);
  }

  get listInitialized() {
    return !!this.listRef?.current;
  }
}
