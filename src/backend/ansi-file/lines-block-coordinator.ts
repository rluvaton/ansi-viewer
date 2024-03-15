import assert from "node:assert";

import {LinesBlock} from "./lines-block";
import {Line, SearchLocation, SearchResult} from "../../shared-types";
import {LINES_BLOCK_SIZE} from "../../shared/constants";
import fs from "node:fs/promises";


/**
 * This class is responsible for:
 * - Coordinating the lines range to the matching block.
 * - Handle optimization like uncompressing next lines (TODO).
 */
export class LinesBlockCoordinator {
    // TODO - maybe use optimized data structure for this maybe

    /**
     * saved blocks
     *
     * this will have the previous block and the next block of the requested block also parsed so it will be faster to access
     *
     * To avoid saving references the same block multiple times we gonna have rounded down to the nearest block size multiplication
     */
    #linesBlocks: LinesBlock[] = [];

    filePath: string;

    #alreadyParsedBlocks: LinesBlock[] = [];

    currentlyNeededBlockIndexes = new Set<number>();

    #getLineNumberForLineMap(lineNumber: number) {
        return Math.floor(lineNumber / LINES_BLOCK_SIZE);
    }

    #addBlock(block: LinesBlock) {
        // the fromLine would already be rounded by the block size
        this.#linesBlocks[this.#getLineNumberForLineMap(block.fromLine)] = block;
    }

    async addBlock(fromLine: number, block: Line[]) {
        assert(block.length <= LINES_BLOCK_SIZE, `Lines block must be of size ${LINES_BLOCK_SIZE} or less`);
        const linesBlock = new LinesBlock(fromLine, fromLine + block.length);
        this.#addBlock(linesBlock);

        await linesBlock.setLines(block);
    }

    getLinesForLineSync(lineNumber: number): Line[] | undefined {
        const blockIndex = this.#getLineNumberForLineMap(lineNumber);
        const block = this.#linesBlocks[blockIndex];

        if (!block) {
            return;
        }

        this.currentlyNeededBlockIndexes.add(blockIndex);

        const currentBlockParsedLines = block.parseLinesSync();

        this.#parsePossibleNextBlockInBackground(blockIndex);
        return currentBlockParsedLines
    }

    async getLinesForLine(lineNumber: number): Promise<Line[] | undefined> {
        const blockIndex = this.#getLineNumberForLineMap(lineNumber);
        // Save 1
        const block = this.#linesBlocks[blockIndex];

        if (!block) {
            return;
        }

        this.currentlyNeededBlockIndexes.add(blockIndex);

        const currentBlockParsedLines = await block.parseLines();

        this.#parsePossibleNextBlockInBackground(blockIndex);

        return currentBlockParsedLines
    }

    #parsePossibleNextBlockInBackground(blockIndex: number) {
        const block = this.#linesBlocks[blockIndex];
        if (!block) {
            // This should not happen as we already checked for this case
            return;
        }

        this.#alreadyParsedBlocks.push(block);

        let blockIndexesToGetReady: number[];

        // if the line is in the first block than load the next 2 blocks
        if (blockIndex === 0) {
            blockIndexesToGetReady = Array.from({length: 9}, (_, i) => i + 1);
        } else if (blockIndex === this.#linesBlocks.length - 1) {
            blockIndexesToGetReady = Array.from({length: 9}, (_, i) => blockIndex - i - 1);
        } else {
            blockIndexesToGetReady = [blockIndex - 2, blockIndex - 1, ...Array.from({length: 7}, (_, i) => blockIndex + i + 1)];
        }

        blockIndexesToGetReady = blockIndexesToGetReady.filter(index =>
            index > 0 &&
            index < this.#linesBlocks.length - 1 &&
            this.#linesBlocks[index]?.isParsed === false
        );

        this.currentlyNeededBlockIndexes.clear();

        this.currentlyNeededBlockIndexes.add(blockIndex);
        blockIndexesToGetReady.forEach(index => this.currentlyNeededBlockIndexes.add(index));

        if (blockIndexesToGetReady.length) {
            // TODO - Allow to stop the parsing if the user scrolled to a different block
            // Avoid parsing if scrolling fast
            setTimeout(async () => {
                try {
                    const parsedBlocks = await Promise.all(
                        blockIndexesToGetReady
                            .filter(index => this.currentlyNeededBlockIndexes.has(index))
                            .map(async index => {
                                const block = this.#linesBlocks[index];

                                await block.parseLines();

                                return block;
                            })
                    )

                    this.#alreadyParsedBlocks.push(...parsedBlocks);
                } catch (e) {
                    console.error('failed parsing next blocks', e);
                }
            }, 0);
        }

        const parsedBlockToClear = this.#alreadyParsedBlocks.filter(block => !this.currentlyNeededBlockIndexes.has(block.fromLine));
        parsedBlockToClear.forEach(block => block.clearParsedLines());
        this.#alreadyParsedBlocks = this.#alreadyParsedBlocks.filter(block => this.currentlyNeededBlockIndexes.has(block.fromLine));
    }

    get totalLines() {
        const countWithoutLastBlock = (this.#linesBlocks.length - 1) * LINES_BLOCK_SIZE;

        const lastBlock = this.#linesBlocks[this.#linesBlocks.length - 1];


        return countWithoutLastBlock + (lastBlock ? lastBlock.toLine - lastBlock.fromLine : 0);
    }

    async search(search: string): Promise<SearchResult[]> {
        // TODO - search even if the result is between blocks
        const fileContent = (await fs.readFile(this.filePath, 'utf-8')).toString();

        // TODO - should better remove the ansi codes
        // TODO - fix this
        // eslint-disable-next-line no-control-regex
        const fileContentWithoutAnsiCodes = fileContent.replace(/\u001b[^m]*?m/g,"")

        const lines = fileContentWithoutAnsiCodes.split('\n');

        const allSearchLocations: SearchResult[] = [];
        let newSearchLocation: SearchResult | undefined;

        do {
            newSearchLocation = this.#getLocationOfSearch({
                search,
                content: fileContentWithoutAnsiCodes,
                lines,
                // This will avoid double highlighting on same location (searching for AA in AAA would result only in 1)
                fromIndex: allSearchLocations[allSearchLocations.length - 1]?.end?.position ?? -1
            });

            if (newSearchLocation) {
                allSearchLocations.push(newSearchLocation);
            }
        } while (newSearchLocation);

        return allSearchLocations;
    }

    #getLocationOfSearch({search, content, lines, fromIndex}: {
        search: string;
        content: string;
        lines: string[];
        fromIndex: number;
    }): SearchResult | undefined {
        const position = content.indexOf(search, fromIndex + 1);

        if (position === -1) {
            return undefined;
        }

        let updatedPosition = position;

        let line = 0;

        let i = 0;

        for (; i < lines.length; i++) {
            const textLine = lines[i];
            if (updatedPosition < textLine.length) {
                break;
            }

            // +1 as we want to also count for the new line character
            // TODO - what about \r\n
            updatedPosition -= textLine.length + 1;
            line++;
        }

        const start = {
            line,
            // The column is what left
            column: updatedPosition,
            position
        };

        updatedPosition += search.length - 1;

        for (; i < lines.length; i++){
            const textLine = lines[i];
            if (updatedPosition < textLine.length) {
                break;
            }

            // +1 as we want to also count for the new line character
            // TODO - what about \r\n
            updatedPosition -= textLine.length + 1;
            line++;
        }

        const end = {
            line,

            // The column is what left
            column: updatedPosition,
            position: position + search.length - 1
        }

        return {
            start,
            end,
        };
    }




}
