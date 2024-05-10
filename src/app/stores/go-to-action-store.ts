import {action, makeObservable, observable} from "mobx";
import React from "react";
import {getContainer} from "./stores-container";
import {setCaretPosition} from "../services/keyboard-navigation-in-file";


// TODO - change to the actual line height by calculating it?
// This is the same value as in `.ansiContainer pre line-height` value, please keep them in sync
export const LINE_HEIGHT = 22;

export const GO_TO_INPUT_PATTERN = '[0-9]+\\s*(:\\s*[0-9]+\\s*)?';
const goToInpuRegex = new RegExp(GO_TO_INPUT_PATTERN);


export class GoToActionStore {
    isOpen: boolean = false;

    // On cursor change this should be changed as well when the popup is closed
    locationInput = '0:0';

    // TODO - implement
    currentCursorLocation = '';
    listRef: React.RefObject<HTMLElement>;

    prefixSizeInPx = 20;
    charSizeInPx = 8;

    constructor() {
        makeObservable(this, {
            isOpen: observable,
            locationInput: observable,
            currentCursorLocation: observable,
            openGoTo: action,
            closeGoTo: action,
            updateLocationInput: action,
        });
    }

    saveTextSizeMetadata(metadata: { prefixSizeInPx: number; charSizeInPx: number }) {
        this.prefixSizeInPx = metadata.prefixSizeInPx;
        this.charSizeInPx = metadata.charSizeInPx;
    }

    registerList(ref: React.RefObject<HTMLElement>) {
        this.listRef = ref;
    }

    unregisterList() {
        this.listRef = null;
    }

    canGoTo() {
        return !!this.listRef?.current && this.prefixSizeInPx != null && this.charSizeInPx != null;
    }

    goToFromInput() {
        if(goToInpuRegex.test(this.locationInput) === false) {
            console.log('invalid input', this.locationInput)
            // Invalid input
            return;
        }

        const [line, column] = this.locationInput.split(':').map(v => parseInt(v.trim(), 10));

        if(!this.canGoToLocation(line, column)) {
            return;
        }

        this.closeGoTo();
        this.goTo(line, column);
    }

    canGoToLocation(lineNumber: number, column: number = 0): boolean {
        if (!this.canGoTo()) {
            return false;
        }

        if(lineNumber % 1 !== 0 || column % 1 !== 0) {
            // No floating point numbers allowed
            return false;
        }

        if(lineNumber < 1 || column < 0) {
            // No negative numbers allowed
            return false;
        }

        return true;
    }

    goTo(lineNumber: number, column = 0) {
        if(!this.canGoToLocation(lineNumber, column)) {
            return;
        }

        // Go to the last line if the line number is bigger than the total lines
        lineNumber = Math.min(lineNumber, getContainer().currentFileStore.totalLines);

        const numberOfVisibleLines = Math.trunc(getContainer().currentInstanceStore.windowInnerHeight / LINE_HEIGHT);

        const contextLines = Math.min(numberOfVisibleLines, 10);

        let lineNumberToScrollTo = lineNumber - contextLines

        // In case below the first line
        lineNumberToScrollTo = Math.max(1, lineNumberToScrollTo);

        // TODO - if the line is already visible don't scroll
        const y = (lineNumberToScrollTo - 1) * LINE_HEIGHT;

        let x = 0;

        if(column) {
            // TODO - if the column can be displayed with the line number than don't add that prefix
            // TODO - calculate context line width
            x = this.prefixSizeInPx + column * this.charSizeInPx;
        }

        this.listRef!.current!.scrollTo({
            top: y,
            left: x,
        });

        // TODO - set caret position
        // TODO - set focus so can set caret position
        // https://gist.github.com/imolorhe/b6ec41233cf7756eeacbb1e38cd42856
        setCaretPosition(this.listRef!.current!, lineNumber, column);
    }

    openGoTo() {
        this.isOpen = true;

        document.addEventListener('keydown', this.onEscape, {signal: getContainer().signal});
    }

    closeGoTo() {
        this.isOpen = false;
        document.removeEventListener('keydown', this.onEscape);

    }

    updateLocationInput(value: string) {
        this.locationInput = value;
    }

    private onEscape = (event: KeyboardEvent) => {
        if(event.key === 'Escape') {
            this.closeGoTo();
        }
    }
}
