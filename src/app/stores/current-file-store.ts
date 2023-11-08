import {action, makeObservable, observable} from "mobx";
import {colorizeAnsi} from "../ansi-viewer/colorize";

type CurrentFileState = 'idle' | 'reading' | 'read' | 'error';

export class CurrentFileStore {
    fileContent: string | undefined;
    currentFileState: CurrentFileState = 'idle';
    viewerContainer: HTMLElement | undefined;

    constructor() {
        makeObservable(this, {
            currentFileState: observable,
            fileContent: observable,
            viewerContainer: observable,
            selectFile: action,
            setFileContent: action,
            setAsReading: action,
            setViewerContainer: action,
            clearViewerContainer: action,
        })
    }

    async selectFile(filePath: string) {
        this.currentFileState = 'reading';

        try {
            const dataIterator = this.readFileIterator(filePath);

            // TODO - remove this after supporting async iterators in the colorizeAnsi function
            let fullContent = '';
            for await (const item of dataIterator) {
                fullContent += item;
            }
            this.setFileContent(fullContent);
        } catch (error) {
            this.setErrorWhileReadingFile(filePath, error);
            return;
        }

        // If while reading, we have the viewer container, colorize the file
        if(this.viewerContainer) {
            await this.colorizeSelectedFile(this.viewerContainer);
        }
    }

    setFileContent(content: string) {
        this.fileContent = content;
        this.currentFileState = 'read';
    }

    async colorizeSelectedFile(container: HTMLElement) {
        const styleElement = document.querySelector('style#common-style') as HTMLStyleElement;
        await colorizeAnsi({
            text: this.fileContent,
            container: container,
            styleElement: styleElement,
        });
    }

    private async *readFileIterator(filePathToRead: string) {
        console.log('start reading file', filePathToRead)
        await window.electron.preStartReadingFile(filePathToRead);

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

        function fileStreamChunkListener(_: unknown, chunk: string) {
            // TODO - handle errors and back-pressure
            values.push(chunk);
            resolve();
        }

        // Attach the listener before reading the file to avoid missing data
        window.electron.listenToFileChunks(filePathToRead, fileStreamChunkListener);
        window.electron.startReadingFile(filePathToRead);

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
                    window.electron.cleanupFileChunkListener(filePathToRead, fileStreamChunkListener);

                    return;
                }

                yield value;
            }
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

    setViewerContainer(container: HTMLElement) {
        this.viewerContainer = container;

        // If the file is already read, colorize it
        if(this.currentFileState === 'read') {
            return this.colorizeSelectedFile(container);
        }
    }

    clearViewerContainer() {
        this.viewerContainer = undefined;
    }
}
