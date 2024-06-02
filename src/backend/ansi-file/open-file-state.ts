import fs from 'node:fs/promises';
import { parseIterator as parseAnsi } from 'ansicolor';
import { BrowserWindow } from 'electron';
import { Line, LineItem } from '../../shared-types';
import { LINES_BLOCK_SIZE } from '../../shared/constants';
import { ParsedFileState } from './parsed-ansi-file';

export class OpenedFileState {
  static #windowToOpenedFileState = new WeakMap<
    BrowserWindow,
    OpenedFileState
  >();

  #parsingAbortController: AbortController;
  #idCounter = 0;
  #commonClassesMap = new Map<string, string>();
  commonStyle = '';
  lines: Line[] = [];

  constructor() {
    this.#setupParsingAbortController();
  }

  static async parseNewFile(
    window: BrowserWindow,
    filePath: string,
  ): Promise<ParsedFileState> {
    let state = OpenedFileState.#windowToOpenedFileState.get(window);

    if (!state) {
      state = new OpenedFileState();
      OpenedFileState.#windowToOpenedFileState.set(window, state);
    }

    state.reset();

    const parsedFileState: ParsedFileState = await state.parseFile(filePath);

    if (!state.#parsingAbortController.signal.aborted) {
      ParsedFileState.addNewState(window, parsedFileState);
    }

    OpenedFileState.#windowToOpenedFileState.delete(window);

    return parsedFileState;
  }

  static abortParsing(window: BrowserWindow) {
    const state = OpenedFileState.#windowToOpenedFileState.get(window);

    if (!state) {
      return;
    }

    state.#parsingAbortController.abort();
  }

  static getOpenedFileState(window: BrowserWindow) {
    return OpenedFileState.#windowToOpenedFileState.get(window);
  }

  #generateId() {
    return `colorize-ansi-${this.#idCounter++}`;
  }

  reset = () => {
    this.abort();
    this.#idCounter = 0;
    this.#commonClassesMap.clear();
    this.commonStyle = '';
    this.lines = [];
  };

  abort() {
    this.#parsingAbortController.abort();
    this.#setupParsingAbortController();
  }

  #setupParsingAbortController() {
    this.#parsingAbortController = new AbortController();
    this.#parsingAbortController.signal.addEventListener('abort', this.reset, {
      once: true,
    });
  }

  #createClassNameForCSS(css: string) {
    if (!css) {
      return;
    }

    let className = this.#commonClassesMap.get(css);

    if (className) {
      return className;
    }

    className = this.#generateId();

    this.#commonClassesMap.set(css, className);

    // This is done to avoid creating a lot of CSS rules which can consume a lot of memory when there are a lot of pre elements
    this.commonStyle += `
pre.${className} {
    ${css}
}`;

    return className;
  }

  async parseFile(filePath: string) {
    const parsedAnsiFile = new ParsedFileState();

    const signal = this.#parsingAbortController.signal;

    if (signal.aborted) {
      throw new Error('Aborted');
    }

    let lineIndex = 0;

    let currentLine: { lineIndex: number; items: LineItem[] } = {
      lineIndex,
      items: [],
    };

    // TODO - use streams so we don't need to load the whole file into memory and to support large files above 1GB
    let fileContent = (
      await fs.readFile(filePath, {
        signal,
      })
    ).toString();

    const spans = parseAnsi(() => {
      // Doing this so fileContent can be GCed after first access
      const tmp = fileContent;
      fileContent = '';
      return tmp;
    });

    for (const span of spans) {
      if (signal.aborted) {
        throw new Error('Aborted');
      }

      const className = this.#createClassNameForCSS(span.css);

      const linesInSpan = span.text.split('\n');
      if (linesInSpan.length === 1) {
        currentLine.items.push({
          text: span.text,
          className,
        });
      } else if (linesInSpan.length > 1) {
        currentLine.items.push({
          text: linesInSpan[0],
          className,
        });
        this.lines.push(
          buildHtmlForItems(currentLine.lineIndex, currentLine.items),
        );
        lineIndex++;

        // Without first and last lines so the first line can be combined with the last line of the previous span
        // and the last line can be combined with the first line of the next span
        for (let j = 1; j < linesInSpan.length - 1; j++) {
          const newLine = [
            {
              text: linesInSpan[j],
              className,
            },
          ];
          this.lines.push(buildHtmlForItems(lineIndex, newLine));
          lineIndex++;
        }

        currentLine = {
          lineIndex: lineIndex,
          items: [],
        };

        // If not empty
        if (linesInSpan[linesInSpan.length - 1]) {
          currentLine.items.push({
            text: linesInSpan[linesInSpan.length - 1],
            className,
          });
        }
      }

      if (this.lines.length > LINES_BLOCK_SIZE) {
        await this.addBlocks(parsedAnsiFile, false);
      }
    }

    if (currentLine) {
      this.lines.push(
        buildHtmlForItems(currentLine.lineIndex, currentLine.items),
      );
    }

    if (this.lines.length) {
      await this.addBlocks(parsedAnsiFile, true);
    }

    parsedAnsiFile.commonStyle = this.commonStyle;

    return parsedAnsiFile;
  }

  async addBlocks(parsedAnsiFile: ParsedFileState, addLastBlock = false) {
    // Chunks should not include the last item
    const chunks: Line[][] = new Array(
      Math.floor(this.lines.length / LINES_BLOCK_SIZE),
    );
    let chunkIndex = 0;

    for (let i = 0; i < this.lines.length; i += LINES_BLOCK_SIZE) {
      // Last item still need more data
      if (!addLastBlock && this.lines.length - i < LINES_BLOCK_SIZE) {
        this.lines = this.lines.slice(i);
        break;
      }

      chunks[chunkIndex] = this.lines.slice(i, i + LINES_BLOCK_SIZE);
      chunkIndex++;
    }

    const currentFromLine = parsedAnsiFile.nextFromLine;
    await Promise.all(
      chunks.map((chunk, index) =>
        parsedAnsiFile.addBlock(
          currentFromLine + index * LINES_BLOCK_SIZE,
          chunk,
        ),
      ),
    );
  }
}

function buildHtmlForItems(lineIndex: number, items: LineItem[]): Line {
  // Mark the inner pre as content-editable="true" so the user can navigate the text with the keyboard
  return {
    line_index: lineIndex,
    __html: `<code contenteditable="false" class="line-number noselect">${
      lineIndex + 1
    }</code><pre role="presentation" contenteditable="true" spellcheck="false" data-disable-content-edit data-line="${
      lineIndex + 1
    }" class="strip-content-editable-style">${items
      .map(
        (item) =>
          `<pre ${item.className ? `class="${item.className}"` : ''}>${
            item.text
          }</pre>`,
      )
      .join('')}</pre>`,
  };
}
