import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { BrowserWindow } from 'electron';
import { Line, LineItem } from '../../shared-types';
import { LINES_BLOCK_SIZE } from '../../shared/constants';
import { runFnAndLogDuration } from '../helper';
import { Span, parseAnsiFromRawSpans, rawParse } from './ansi-parser';
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

    parsedAnsiFile.totalLines = await this.getNumberOfLinesInFile(filePath);

    await runFnAndLogDuration({
      name: `parse file intro for ${path.basename(filePath)}`,
      fn: () => this.#parseAnsiFile(parsedAnsiFile, filePath, true),
      logArgs: {
        filePath,
      },
    });

    // This can happen if the file is bigger than the intro blocks
    if (parsedAnsiFile.shouldCreateFull()) {
      setTimeout(async () => {
        if (this.#parsingAbortController.signal.aborted) {
          return;
        }
        try {
          await runFnAndLogDuration({
            name: `parse file full for ${path.basename(filePath)}`,
            fn: () => this.#parseAnsiFile(parsedAnsiFile, filePath, false),
            logArgs: {
              filePath,
            },
            modifyLogMessage(msg: string) {
              return `################\n${msg}\n################`;
            },
          });

          await this.#parseAnsiFile(parsedAnsiFile, filePath, false);
        } catch (e) {
          console.error('failed parsing file', e);
        }
      }, 0);
    }

    return parsedAnsiFile;
  }

  async #parseAnsiFile(
    parsedAnsiFile: ParsedFileState,
    filePath: string,
    createIntro: boolean,
  ) {
    const signal = this.#parsingAbortController.signal;
    if (signal.aborted) {
      throw new Error('Aborted');
    }

    const exitEarlyAC = new AbortController();

    let lineIndex = 0;

    // Cleanup the listeners when other one is called
    const combinedAC = new AbortController();

    signal.addEventListener(
      'abort',
      () => {
        combinedAC.abort();
      },
      { once: true },
    );

    exitEarlyAC.signal.addEventListener(
      'abort',
      () => {
        combinedAC.abort();
      },
      { once: true },
    );

    const fileStream = createReadStream(filePath, {
      signal: combinedAC.signal,
      highWaterMark: 1048576, // 1MB
    });

    let blocksLoaded = 0;

    const createClassNameForCSS = this.#createClassNameForCSS.bind(this);

    const exitEarlySignal = Symbol('exitEarlySignal');

    try {
      await fileStream
        .compose(rawParse, { signal: combinedAC.signal })
        // @ts-expect-error TODO: fix types
        .compose(parseAnsiFromRawSpans, { signal: combinedAC.signal })
        .compose(
          async function* (stream: AsyncIterable<Span>) {
            let currentLine: { lineIndex: number; items: LineItem[] } = {
              lineIndex,
              items: [],
            };

            for await (const span of stream) {
              const className = createClassNameForCSS(span.css);

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
                yield buildHtmlForItems(
                  currentLine.lineIndex,
                  currentLine.items,
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
                  yield buildHtmlForItems(lineIndex, newLine);
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
            }

            if (currentLine) {
              yield buildHtmlForItems(currentLine.lineIndex, currentLine.items);
            }
          },
          { signal: combinedAC.signal },
        )
        .compose(
          async function* (lines: AsyncIterable<Line>) {
            let block: Line[] = new Array(LINES_BLOCK_SIZE);
            let i = 0;
            let empty = true;

            for await (const line of lines) {
              empty = false;
              block[i++] = line;

              if (i === LINES_BLOCK_SIZE) {
                yield block;
                block = new Array(LINES_BLOCK_SIZE);
                i = 0;
                empty = true;
              }
            }

            if (!empty) {
              yield block.slice(0, i);
            }
          },
          { signal: combinedAC.signal },
        )
        .forEach(
          async (block: Line[]) => {
            await parsedAnsiFile.addBlock(block, createIntro);
            // if (!createIntro) {
            //   console.log(
            //     `Block loaded from line ${block[0].lineIndex} to ${
            //       block[block.length - 1].lineIndex
            //     }`,
            //   );
            // }

            if (createIntro) {
              // TODO - remove this for the one outside the if
              // await parsedAnsiFile.addBlock(block, createIntro);
              blocksLoaded++;
              if (blocksLoaded >= 10) {
                exitEarlyAC.abort(exitEarlySignal);
              }
            }
          },
          { signal: combinedAC.signal },
        );
    } catch (e) {
      // If not aborted by early exit
      if (
        e.code !== 'ABORT_ERR' ||
        exitEarlyAC.signal.reason !== exitEarlySignal
      ) {
        console.error('Fail to read file', e);
        throw e;
      }
    }

    if (!createIntro) {
      parsedAnsiFile.markAsReady();
    } else if (!exitEarlyAC.signal.aborted) {
      console.log(
        'File is small enough to be loaded in one go, marking intro as full',
      );
      // If the file is small and we didn't abort it early
      parsedAnsiFile.markIntroAsFull();
    }

    parsedAnsiFile.commonStyle = this.commonStyle;

    return parsedAnsiFile;
  }

  async getNumberOfLinesInFile(filePath: string) {
    console.time(`computeTotalLines ${path.basename(filePath)}`);
    // Read file using file handle and compute number of lines
    const fileHandle = await fs.open(filePath, 'r');
    let totalLines = 0;
    try {
      while (true) {
        const { bytesRead, buffer } = await fileHandle.read(
          Buffer.alloc(1048576),
          0,
          1048576,
        );
        if (bytesRead === 0) {
          break;
        }

        totalLines += buffer.toString().split('\n').length - 1;
      }
    } finally {
      await fileHandle.close();
    }
    //
    // const numberOfLines = await createReadStream(filePath).reduce((totalLines, chunk) =>
    //         totalLines +
    //         // -1 because we only wanna count the number of new lines
    //         chunk.toString().split('\n').length - 1,
    //     0, {
    //         signal: this.#parsingAbortController.signal
    //     }
    // );
    console.timeEnd(`computeTotalLines ${path.basename(filePath)}`);

    return totalLines;
  }

  async fastWay() {
    // TODO
    // 1. Have predefined styles (as there are not that many - when using basic ansi) and use them OR just use inline styles
    // 2. Get total line numbers of the file
    // 3. Read the first 10 blocks so the user can see it fast
    // 4. In the background create a map for:
    //    - start block line number -> offset in the file
    //    - start block line number -> which color it has at the beginning (like from previous line)
    // 5. When the user scrolls to a line that is not in the first 10 blocks:
    //    - read from the file the block that contains the line
    //    - in the background read the next one and prev one block so it will be ready when the user scrolls to it
  }
}

function buildHtmlForItems(lineIndex: number, items: LineItem[]): Line {
  // Mark the inner pre as content-editable="true" so the user can navigate the text with the keyboard
  return {
    lineIndex,
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
