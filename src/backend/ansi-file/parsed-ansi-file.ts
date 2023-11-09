import {BrowserWindow} from "electron";
import {Line} from "../../shared-types";
import {LinesBlockCoordinator} from "./lines-block-coordinator";


export class ParsedFileState {
    static #windowToParsedFileState = new WeakMap<BrowserWindow, ParsedFileState>();

    #closeFileAbortController: AbortController;
    commonStyle = '';
    #blockCoordinator: LinesBlockCoordinator = new LinesBlockCoordinator();
    nextFromLine = 0;

    constructor() {
        this.#setupCloseFileAbortController();
    }

    static addNewState(window: BrowserWindow, state: ParsedFileState) {
        ParsedFileState.#windowToParsedFileState.set(window, state);
    }

    static abortParsing(window: BrowserWindow) {
        const state = ParsedFileState.#windowToParsedFileState.get(window);

        if (!state) {
            return;
        }

        state.abort();

        ParsedFileState.#windowToParsedFileState.delete(window);
    }

    static getOpenedFileState(window: BrowserWindow) {
        return this.#windowToParsedFileState.get(window);
    }

    reset = () => {
        this.abort();
    }

    abort() {
        this.#closeFileAbortController.abort();
        this.#setupCloseFileAbortController();
    }

    #setupCloseFileAbortController() {
        this.#closeFileAbortController = new AbortController();
        this.#closeFileAbortController.signal.addEventListener('abort', this.reset, {once: true});
    }

    async addBlock(fromLine: number, block: Line[]) {
        this.nextFromLine = Math.max(fromLine + block.length + 1, this.nextFromLine);
        await this.#blockCoordinator.addBlock(fromLine, block);
    }

    get totalLines() {
        return this.nextFromLine;
    }

    getLines(fromLine: number) {
        return this.#blockCoordinator.getLinesForLine(fromLine);
    }

}


