import { BrowserWindow } from 'electron';
import { Line, SearchRequest, SearchResult } from '../../shared-types';
import { LinesBlockCoordinator } from './lines-block-coordinator';

export class ParsedFileState {
  static #windowToParsedFileState = new WeakMap<
    BrowserWindow,
    ParsedFileState
  >();

  #closeFileAbortController: AbortController;
  commonStyle = '';
  #blockCoordinator: LinesBlockCoordinator = new LinesBlockCoordinator();
  nextFromLine = 0;

  constructor(filePath: string) {
    this.#setupCloseFileAbortController();

    this.#blockCoordinator.filePath = filePath;
  }

  static addNewState(window: BrowserWindow, state: ParsedFileState) {
    ParsedFileState.#windowToParsedFileState.set(window, state);
  }

  static removeStateForWindow(window: BrowserWindow) {
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
  };

  abort() {
    this.#closeFileAbortController.abort();
    this.#setupCloseFileAbortController();
  }

  #setupCloseFileAbortController() {
    this.#closeFileAbortController = new AbortController();
    this.#closeFileAbortController.signal.addEventListener(
      'abort',
      this.reset,
      { once: true },
    );
  }

  async addBlock(fromLine: number, block: Line[]) {
    this.nextFromLine = Math.max(fromLine + block.length, this.nextFromLine);
    await this.#blockCoordinator.addBlock(fromLine, block);
  }

  get totalLines() {
    return this.nextFromLine;
  }

  getLinesSync(fromLine: number) {
    return this.#blockCoordinator.getLinesForLineSync(fromLine);
  }

  getLines(fromLine: number): Promise<Line[]> {
    return this.#blockCoordinator.getLinesForLine(fromLine);
  }

  async search(search: SearchRequest): Promise<SearchResult> {
    return this.#blockCoordinator.search(search);
  }
}
