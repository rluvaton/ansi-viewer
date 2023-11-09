import {action, makeObservable, observable, reaction} from "mobx";
import {getContainer} from "./stores-container";
import {FileParsedEvent} from "../../shared-types";

type FileSelectingState = 'idle' | 'selecting' | 'selected' | 'error';

export class FileSelectorStore {
    public currentFilePath: string | undefined;
    public fileSelectingState: FileSelectingState = 'idle';

    constructor(cleanupSignal: AbortSignal) {
        makeObservable(this, {
            currentFilePath: observable,
            fileSelectingState: observable,
            refresh: action,
            selectFile: action,
            noFileSelected: action,
            errorSelectingFile: action,
            errorReadingFile: action,
            setFileAsSelected: action,
        });

        const {currentInstanceStore} = getContainer();
        reaction(() => currentInstanceStore.refreshKey, () => this.refresh(), {
            signal: cleanupSignal
        });
    }

    async refresh() {
        const {currentFileStore} = getContainer();

        switch (this.fileSelectingState) {
            case 'idle':
                break;
            case 'selecting':
                this.fileSelectingState = 'idle';
                this.currentFilePath = undefined;
                currentFileStore.reset();
                await this.selectFile()
                break;
            case 'selected':
                if (this.currentFilePath) {
                    currentFileStore.reselectSameFile(this.currentFilePath);
                } else {
                    this.fileSelectingState = 'idle';
                }
                break;
            case 'error':
                this.fileSelectingState = 'idle';
                this.currentFilePath = undefined;
                currentFileStore.reset();
                break;

            default:
                throw new Error(`Unknown file selecting state: ${this.fileSelectingState}`);
        }
    }

    selectFile = async () => {
        const prevState = this.fileSelectingState
        const prevFilePath = this.currentFilePath;

        this.fileSelectingState = 'selecting';
        let selectedFileEvent: FileParsedEvent;

        try {
            ([selectedFileEvent] = await Promise.all([
                window.electron.waitForNewFile(),
                window.electron.selectFile(),
            ]));
        } catch (error) {
            this.errorSelectingFile({prevFilePath, error});
            return;
        }

        await this.onFileSelected(selectedFileEvent, {
            state: prevState,
            filePath: prevFilePath,
        });

    }

    onFileSelected = async (event: FileParsedEvent | undefined, prev?: {
        state: FileSelectingState,
        filePath: string | undefined,
    }) => {
        if (!event?.filePath && prev) {
            this.noFileSelected(prev.state, prev.filePath);
            return;
        }

        this.setFileAsSelected(event.filePath);
        // TODO - while selecting file we should allow to select another file and abort the previous one

        try {
            // TODO - different error based on error type
            getContainer().currentFileStore.selectFile(event);
        } catch (error) {
            this.errorReadingFile(error);
        }
    }

    noFileSelected(prevState: FileSelectingState, prevFilePath: string | undefined) {
        this.fileSelectingState = prevState;
        this.currentFilePath = prevFilePath;
    }

    errorSelectingFile(error: unknown) {
        // TODO - add toast
        console.error('Error while selecting file', error);
        this.fileSelectingState = 'error';
        this.currentFilePath = undefined;
    }

    errorReadingFile(error: unknown) {
        // TODO - add toast
        console.error('Error while reading file', error);
        this.fileSelectingState = 'error';
        this.currentFilePath = undefined;
    }

    setFileAsSelected(newFilePath: string) {
        this.currentFilePath = newFilePath;
        this.fileSelectingState = 'selected';
    }
}
