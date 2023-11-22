import {createReadStream} from "node:fs";
import {Span, parseAnsiTransformer, rawParse, parseAnsiFromRawSpans} from "./ansi-parser";
import {BrowserWindow} from "electron";
import {Line, LineItem} from "../../shared-types";
import {ParsedFileState} from "./parsed-ansi-file";
import {LINES_BLOCK_SIZE} from "../../shared/constants";

export class OpenedFileState {
    static #windowToOpenedFileState = new WeakMap<BrowserWindow, OpenedFileState>();

    #parsingAbortController: AbortController;
    #idCounter = 0;
    #commonClassesMap = new Map<string, string>();
    commonStyle = '';

    constructor() {
        this.#setupParsingAbortController();
    }

    static async parseNewFile(window: BrowserWindow, filePath: string): Promise<ParsedFileState> {
        let state = OpenedFileState.#windowToOpenedFileState.get(window);

        if (!state) {
            state = new OpenedFileState();
            OpenedFileState.#windowToOpenedFileState.set(window, state);
        }

        state.reset()

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
    }

    abort() {
        this.#parsingAbortController.abort();
        this.#setupParsingAbortController();
    }

    #setupParsingAbortController() {
        this.#parsingAbortController = new AbortController();
        this.#parsingAbortController.signal.addEventListener('abort', this.reset, {once: true});
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

        const fileStream = createReadStream(filePath, {
            signal,
            highWaterMark: 1048576 // 1MB
        });

        const createClassNameForCSS = this.#createClassNameForCSS.bind(this);

        await fileStream
            .compose(rawParse)
            // @ts-expect-error TODO: fix types
            .compose(parseAnsiFromRawSpans)
            .compose(async function* (stream: AsyncIterable<Span>) {
                let currentLine: { lineIndex: number, items: LineItem[] } = {
                    lineIndex,
                    items: [],
                };

                for await (const span of stream) {
                    const className = createClassNameForCSS(span.css);

                    const linesInSpan = span.text.split("\n");
                    if (linesInSpan.length === 1) {
                        currentLine.items.push({
                            text: span.text,
                            className
                        });
                    } else if (linesInSpan.length > 1) {
                        currentLine.items.push({
                            text: linesInSpan[0],
                            className
                        });
                        yield buildHtmlForItems(currentLine.lineIndex, currentLine.items)
                        lineIndex++;

                        // Without first and last lines so the first line can be combined with the last line of the previous span
                        // and the last line can be combined with the first line of the next span
                        for (let j = 1; j < linesInSpan.length - 1; j++) {
                            const newLine = [{
                                text: linesInSpan[j],
                                className
                            }];
                            yield buildHtmlForItems(lineIndex, newLine);
                            lineIndex++;
                        }

                        currentLine = {
                            lineIndex: lineIndex,
                            items: [],
                        }

                        // If not empty
                        if (linesInSpan[linesInSpan.length - 1]) {
                            currentLine.items.push({
                                text: linesInSpan[linesInSpan.length - 1],
                                className
                            });
                        }
                    }
                }

                if (currentLine) {
                    yield buildHtmlForItems(currentLine.lineIndex, currentLine.items);
                }
            })
            .compose(async function* (lines: AsyncIterable<Line>) {
                let block: Line[] = new Array(LINES_BLOCK_SIZE);
                let i = 0;
                let empty = true;

                for await (const line of lines) {
                    empty = false;
                    block[i++] = line;

                    if (i === LINES_BLOCK_SIZE) {
                        yield {
                            fromLine: parsedAnsiFile.nextFromLine + LINES_BLOCK_SIZE,
                            block
                        }
                        block = new Array(LINES_BLOCK_SIZE);
                        i = 0;
                        empty = true;
                    }
                }

                if (!empty) {
                    yield {
                        fromLine: parsedAnsiFile.nextFromLine + LINES_BLOCK_SIZE,
                        block: block.slice(0, i)
                    }
                }
            })
            .forEach(async ({fromLine, block}: { fromLine: number, block: Line[] }) => {
                await parsedAnsiFile.addBlock(fromLine, block)
            });


        parsedAnsiFile.commonStyle = this.commonStyle;

        return parsedAnsiFile;
    }
}


function buildHtmlForItems(lineIndex: number, items: LineItem[]): Line {
    return {
        lineIndex,
        __html: `<code class="line-number noselect">${lineIndex + 1}</code>${items.map((item) => `<pre ${item.className ? `class="${item.className}"` : ''}>${item.text}</pre>`).join('')}`
    }
}

