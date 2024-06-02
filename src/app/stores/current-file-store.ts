import { action, makeObservable, observable } from 'mobx';
import { FileParsedEvent, Line } from '../../shared-types';
import { LINES_BLOCK_SIZE } from '../../shared/constants';
import { LinesStorage } from '../lines-storage';
import { Backend } from '../services';
import { getLinesInBlocks } from '../services/backend';
import { getContainer } from './stores-container';

type CurrentFileState = 'idle' | 'reading' | 'read' | 'error';

export class CurrentFileStore {
  fileContent: string | undefined;
  currentFileState: CurrentFileState = 'idle';

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

  reset() {
    this.resetAbortController.abort();
    this.resetAbortController = new AbortController();
    this.currentFileState = 'idle';
    this.fileContent = undefined;
    this.linesStorage.reset();
  }

  selectFile(event: FileParsedEvent, resetBefore = false) {
    if (resetBefore) {
      this.reset();
    } else {
      this.linesStorage.reset();
    }

    this.linesStorage.addLines(event.first_lines);
    this.totalLines = event.total_lines;
    this.currentFileState = 'read';
    this.linesRerenderKey++;
    this.commonStyleElement.innerHTML = event.global_style;
  }

  async reselectSameFile(filePath: string) {
    this.selectFile(
      {
        file_path: filePath,
        first_lines: await Backend.getLines(0, LINES_BLOCK_SIZE),
        total_lines: this.totalLines,
        global_style: this.commonStyleElement.innerHTML,
        requested_from_client: true,
      },
      true,
    );
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
          Backend.getLines(
            startLineNumber + i * LINES_BLOCK_SIZE + 1,
            Math.min(
              startLineNumber + (i + 1) * LINES_BLOCK_SIZE,
              endLineNumber,
            ),
            // TODO - move the mapping file path to this class
            getContainer().fileSelectorStore.mappingFilePath,
          ),
        ),
      ),
    );

    // this.linesStorage.addBlocks(await Backend.getLinesInBlocks(startLineNumber, endLineNumber, getContainer().fileSelectorStore.mappingFilePath));
  };

  // the generated class name is the one that in the common style, style element
  getLine(lineNumber: number): Line | undefined {
    return this.linesStorage.getLine(lineNumber);
  }
}
