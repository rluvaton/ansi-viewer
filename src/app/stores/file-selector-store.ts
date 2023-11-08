import {action, makeObservable, observable} from "mobx";
import {getContainer} from "./stores-container";

type FileSelectingState = 'idle' | 'selecting' | 'selected' | 'error';

export class FileSelectorStore {
    public currentFilePath: string | undefined;
    public fileSelectingState: FileSelectingState = 'idle';

    constructor() {
        makeObservable(this, {
            currentFilePath: observable,
            fileSelectingState: observable,
            selectFile: action,
            noFileSelected: action,
            errorSelectingFile: action,
            errorReadingFile: action,
            setFileAsSelected: action,
        })
    }

    selectFile = async () => {
        const prevState = this.fileSelectingState
        const prevFilePath = this.currentFilePath;

        this.fileSelectingState = 'selecting';
        let filePathToRead: string;

        try {
            filePathToRead = await window.electron.selectFile();

            if (!filePathToRead) {
                this.noFileSelected(prevState, prevFilePath);
                return;
            }

            this.setFileAsSelected(filePathToRead);
        } catch (error) {
            this.errorSelectingFile({prevFilePath, error});
            return;
        }

        // TODO - while selecting file we should allow to select another file and abort the previous one

        try {
            // TODO - different error based on error type
            await getContainer().currentFileStore.selectFile(filePathToRead);
        } catch (error) {
            this.errorReadingFile(error);
        }
        // TODO - read file?
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
