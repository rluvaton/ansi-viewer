import {LinesBlock} from "./lines-block";
import {Line} from "../../shared-types";

import assert from "node:assert";


// Number of lines in a block
export const BLOCK_SIZE = 100;

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
    #lineNumberToBlockIndexMap: LinesBlock[] = [];

    #alreadyParsedBlocks: LinesBlock[] = [];

    currentlyNeededBlockIndexes = new Set<number>();

    #getLineNumberForLineMap(lineNumber: number) {
        return Math.floor(lineNumber / BLOCK_SIZE);
    }

    #getBlockForLine(lineNumber: number): LinesBlock | undefined {
        return this.#lineNumberToBlockIndexMap[this.#getLineNumberForLineMap(lineNumber)];
    }

    #addBlock(block: LinesBlock) {
        // the fromLine would already be rounded by the block size
        this.#lineNumberToBlockIndexMap[this.#getLineNumberForLineMap(block.fromLine)] = block;
    }

    setup(lines: Line[]) {
        this.#lineNumberToBlockIndexMap = new Array(this.#getLineNumberForLineMap(lines.length - 1) + 1);

        for (let fromLine = 0; fromLine < lines.length; fromLine += BLOCK_SIZE) {
            const toLine = Math.min(fromLine + BLOCK_SIZE, lines.length);
            const blockLines = lines.slice(fromLine, toLine);
            this.#addBlock(new LinesBlock(fromLine, toLine, blockLines));
        }
    }

    async addBlock(fromLine: number, block: Line[]) {
        assert(block.length <= BLOCK_SIZE, `Lines block must be of size ${BLOCK_SIZE} or less`);
        const linesBlock = new LinesBlock(fromLine, fromLine + block.length);
        this.#addBlock(linesBlock);

        await linesBlock.setLines(block);
    }

    getLinesForLine(lineNumber: number): Line[] | undefined {
        const blockIndex = this.#getLineNumberForLineMap(lineNumber);
        // Save 1
        const block = this.#lineNumberToBlockIndexMap[blockIndex];

        if (!block) {
            return;
        }

        this.currentlyNeededBlockIndexes.add(blockIndex);

        const currentBlockParsedLines = block.parseLines();

        this.#alreadyParsedBlocks.push(block);

        let blockIndexesToGetReady: number[];

        // if the line is in the first block than load the next 2 blocks
        if (blockIndex === 0) {
            blockIndexesToGetReady = [1, 2];
        } else if (blockIndex === this.#lineNumberToBlockIndexMap.length - 1) {
            blockIndexesToGetReady = [blockIndex - 1, blockIndex - 2];
        } else {
            blockIndexesToGetReady = [blockIndex - 1, blockIndex + 1];
        }

        blockIndexesToGetReady = blockIndexesToGetReady.filter(index =>
            index > 0 &&
            index < this.#lineNumberToBlockIndexMap.length - 1 &&
            this.#lineNumberToBlockIndexMap[index]?.isParsed === false
        );

        this.currentlyNeededBlockIndexes.clear();

        this.currentlyNeededBlockIndexes.add(blockIndex);
        blockIndexesToGetReady.forEach(index => this.currentlyNeededBlockIndexes.add(index));

        if (blockIndexesToGetReady.length) {
            // TODO - Allow to stop the parsing if the user scrolled to a different block
            // Avoid parsing if scrolling fast
            setTimeout(async () => {
                const parsedBlocks = await Promise.all(
                    blockIndexesToGetReady
                        .filter(index => this.currentlyNeededBlockIndexes.has(index))
                        .map(async index => {
                            const block = this.#lineNumberToBlockIndexMap[index];

                            await block.parseLinesBackground();

                            return block;
                        })
                )
                this.#alreadyParsedBlocks.push(...parsedBlocks);
            }, 0);
        }

        const parsedBlockToClear = this.#alreadyParsedBlocks.filter(block => !this.currentlyNeededBlockIndexes.has(block.fromLine));
        parsedBlockToClear.forEach(block => block.clearParsedLines());
        this.#alreadyParsedBlocks = this.#alreadyParsedBlocks.filter(block => this.currentlyNeededBlockIndexes.has(block.fromLine));

        return currentBlockParsedLines
    }
}
