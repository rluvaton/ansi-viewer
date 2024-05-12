import { BrowserWindow } from 'electron';
import { Line } from '../../shared-types';
import { LinesBlockCoordinator } from './lines-block-coordinator';

export class ParsedFileState {
  static #windowToParsedFileState = new WeakMap<
    BrowserWindow,
    ParsedFileState
  >();

  #closeFileAbortController: AbortController;
  commonStyle = '';

  #introBlockCoordinator: LinesBlockCoordinator = new LinesBlockCoordinator();
  introNextFromLine = 0;

  #blockCoordinator: LinesBlockCoordinator = new LinesBlockCoordinator();
  nextFromLine = 0;

  totalLines: number;
  isInIntro = true;

  constructor() {
    this.#setupCloseFileAbortController();
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

  /**
   *
   * @param block
   * @param isIntro is this is the starting blocks only made for fast file opening?
   */
  async addBlock(block: Line[], isIntro: boolean) {
    if (isIntro) {
      const from = this.introNextFromLine;
      this.introNextFromLine = from + block.length;
      await this.#introBlockCoordinator.addBlock(from, block);
    } else {
      const from = this.nextFromLine;
      this.nextFromLine = from + block.length;
      await this.#blockCoordinator.addBlock(from, block);
    }
  }

  getLinesSync(fromLine: number) {
    if (this.isInIntro) {
      return this.#introBlockCoordinator.getLinesForLineSync(fromLine);
    } else {
      return this.#blockCoordinator.getLinesForLineSync(fromLine);
    }
  }

  getLines(fromLine: number): Promise<Line[]> {
    if (this.isInIntro) {
      return this.#introBlockCoordinator.getLinesForLine(fromLine);
    } else {
      return this.#blockCoordinator.getLinesForLine(fromLine);
    }
  }

  markAsReady() {
    this.isInIntro = false;
    this.#introBlockCoordinator = undefined;
    this.introNextFromLine = 0;
  }

  markIntroAsFull() {
    this.nextFromLine = this.introNextFromLine;
    this.#blockCoordinator = this.#introBlockCoordinator;

    this.markAsReady();
  }

  shouldCreateFull() {
    return this.isInIntro;
  }
}
