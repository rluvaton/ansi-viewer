import * as zlib from "node:zlib";
import {BLOCK_SIZE} from "./lines-block-coordinator";
import { promisify } from "node:util";
import {Line} from "../../shared-types";


const unzip = promisify(zlib.unzip);
const gzip = promisify(zlib.gzip);

export class LinesBlock {
    readonly index: number;
    /**
     * Included
     */
    readonly fromLine: number;

    /**
     * Excluded
     */
    readonly toLine: number;

    ready = false;

    /**
     * Compressed lines
     */
    lines: Buffer;

    parsedLines: Line[] | undefined;

    isParsed = false;

    constructor(fromLine: number, toLine: number, lines?: Line[]) {
        this.index = Math.floor(fromLine / BLOCK_SIZE);
        this.fromLine = fromLine;
        this.toLine = toLine;
        this.lines = lines ? LinesBlock.#compressLinesSync(lines) : Buffer.from('');
        this.ready = !!lines;
    }

    async setLines(lines: Line[]) {
        this.lines = await LinesBlock.#compressLines(lines);
        this.ready = true;
    }

    parseLines() {
        if(this.parsedLines) {
            return this.parsedLines;
        }

        // TODO - should not do this if the lines are current parsing
        this.parsedLines = LinesBlock.#decompressLinesSync(this.lines);

        this.isParsed = true;
        return this.parsedLines;
    }

    async parseLinesBackground() {
        if(this.parsedLines) {
            return;
        }

        this.parsedLines = await LinesBlock.#decompressLines(this.lines);

        this.isParsed = true;
        return this.parsedLines;
    }

    clearParsedLines() {
        this.isParsed = false;
        this.parsedLines = undefined;
    }

    static #compressLinesSync(lines: Line[]): Buffer {
        const str = JSON.stringify(lines);

        return zlib.gzipSync(str);
    }

    static async #compressLines(lines: Line[]): Promise<Buffer> {
        const str = JSON.stringify(lines);

        // TODO - maybe allow to abort
        return await gzip(str);
    }

    static #decompressLinesSync(compressedLines: Buffer): Line[] {
        return JSON.parse(zlib.unzipSync(compressedLines).toString());
    }

    static async #decompressLines(compressedLines: Buffer): Promise<Line[]> {
        // TODO - allow to abort
        return JSON.parse((await unzip(compressedLines)).toString());
    }
}
