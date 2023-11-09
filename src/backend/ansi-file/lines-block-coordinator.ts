import assert from "node:assert";

import {LinesBlock} from "./lines-block";
import {Line} from "../../shared-types";
import {LINES_BLOCK_SIZE} from "../../shared/constants";


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
        if(!block) {
            // This should not happen as we already checked for this case
            return;
        }

        this.#alreadyParsedBlocks.push(block);

        let blockIndexesToGetReady: number[];

        // if the line is in the first block than load the next 2 blocks
        if (blockIndex === 0) {
            blockIndexesToGetReady = [1, 2];
        } else if (blockIndex === this.#linesBlocks.length - 1) {
            blockIndexesToGetReady = [blockIndex - 1, blockIndex - 2];
        } else {
            blockIndexesToGetReady = [blockIndex - 1, blockIndex + 1];
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

}
