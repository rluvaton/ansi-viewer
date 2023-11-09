import {action, makeObservable, observable} from "mobx";
import {FileParsedEvent, Line} from "../../shared-types";

type CurrentFileState = 'idle' | 'reading' | 'read' | 'error';

export class CurrentFileStore {
    fileContent: string | undefined;
    currentFileState: CurrentFileState = 'idle';

    commonStyleElement: HTMLStyleElement;
    lines: Line[] = [];
    linesLinkedList 
    totalLines = 0;
    linesRerenderKey = 0;
    currentLineNumber: number | undefined;

    resetAbortController: AbortController = new AbortController();

    constructor() {
        makeObservable(this, {
            currentFileState: observable,
            fileContent: observable,
            linesRerenderKey: observable,
            reset: action,
            selectFile: action,
            setLines: action,
            setAsReading: action,
            loadMoreLines: action,
        });

        this.commonStyleElement = document.querySelector('style#common-style') as HTMLStyleElement;
    }

    reset() {
        this.resetAbortController.abort();
        this.resetAbortController = new AbortController();
        this.currentFileState = 'idle';
        this.fileContent = undefined;
        this.lines = [];
    }

    selectFile(event: FileParsedEvent, resetBefore = false) {
        if (resetBefore) {
            this.reset();
        }
        // this.currentFileState = 'reading';

        this.lines = event.firstLines;
        this.totalLines = event.totalLines;
        this.currentFileState = 'read';
        this.linesRerenderKey++;
        this.commonStyleElement.innerHTML = event.globalStyle;
    }

    reselectSameFile(filePath: string) {
        const firstLines = window.electron.getLines(0);
        this.selectFile({
            firstLines,
            filePath,
            totalLines: this.totalLines,
            globalStyle: this.commonStyleElement.innerHTML,
        }, true);
    }

    private async* readFileIterator(filePathToRead: string) {
        console.log('start reading file', filePathToRead)
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
        const valuesOutOfOrder: { index: number, value: string }[] = [];
        let currentChunkIndex = -1;

        let timeoutTimer: NodeJS.Timeout;

        function fileStreamChunkListener(_: unknown, chunkIndex: number, chunk: string) {
            clearTimeout(timeoutTimer);

            timeoutTimer = setTimeout(() => {
                const timeoutError = new Error(`Timeout while reading file ${filePathToRead}`);
                console.error(timeoutError.message, {
                    values: [...values],
                    valuesOutOfOrder: [...valuesOutOfOrder],
                    currentChunkIndex,
                    error: timeoutError
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

                while (valuesOutOfOrder.length > 0 && valuesOutOfOrder[0].index === currentChunkIndex + 1) {
                    currentChunkIndex++;
                    values.push(valuesOutOfOrder.shift()!.value);
                }

                // TODO - handle errors and back-pressure
                resolve();
            } else {
                valuesOutOfOrder.push({index: chunkIndex, value: chunk});

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

        this.resetAbortController.signal.addEventListener('abort', onAbort, {once: true});

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
            window.electron.cleanupFileChunkListener(filePathToRead, fileStreamChunkListener);
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
        // TODO - should then cache the lines that are loaded and not ask again until reading new lines that are not part of the current view + buffer
        return this.currentFileState === 'read' && this.lines[lineNumber] !== undefined;
    }

    loadMoreLines = async (startLineNumber: number, endLineNumber: number) => {
        // TODO - support endLineNumber
        this.lines = window.electron.getLines(startLineNumber);
        this.currentLineNumber = startLineNumber;
        // TODO - implement by asking the backend to read the lines and parse it here
    }

    // the generated class name is the one that in the common style, style element
    getLine(lineNumber: number): Line | undefined {
        return this.lines[lineNumber];
    }

    setLines(lines: Line[]) {
        this.lines = lines;
        this.linesRerenderKey++;
    }
}
