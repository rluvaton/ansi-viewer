import { Line } from '../shared-types';

export class LinesStorage {
  maxSize: number;

  #lines: Line[][];

  constructor(maxSize: number) {
    if (maxSize < 2) {
      throw new Error('maxSize must be at least 2');
    }
    this.maxSize = maxSize;

    // Not creating the array with the maxSize because we want to know the actual length of the array
    this.#lines = [];
  }

  addLines(lines: Line[]) {
    if (this.#lines.length === 0) {
      this.#lines.push(lines);
      return;
    }

    const newFirstLine = lines[0].line_index;
    const newLastLine = lines[lines.length - 1].line_index;

    // can be either overlapping or
    const currentFirstLine = this.#lines[0][0].line_index;
    const lastSavedLinesBlock = this.#lines[this.#lines.length - 1];
    const currentLastLine =
      lastSavedLinesBlock[lastSavedLinesBlock.length - 1].line_index;

    if (newFirstLine > currentLastLine) {
      // add to the end
      this.#lines.push(lines);
      if (this.#lines.length > this.maxSize) {
        this.#lines.shift();
      }

      return;
    } else if (newLastLine < currentFirstLine) {
      // add to the beginning
      this.#lines.unshift(lines);
      if (this.#lines.length > this.maxSize) {
        this.#lines.pop();
      }

      return;
    }

    // if the last line of the current block is after the first line of the new block
    // which means that the found index represents a block that is after the new block
    const theLineIndexThatShouldBeAfterNewBlock = this.#lines.findIndex(
      (lines) => lines[lines.length - 1].line_index > newFirstLine,
    );
    if (theLineIndexThatShouldBeAfterNewBlock === -1) {
      throw new Error(
        'this should not be possible as we already checked for this case where the new block should be added at the end',
      );
    }

    // if the first line of the current block is BEFORE the last line of the new block
    // which means that the found index represents a block that is after the new block
    const theLineIndexThatShouldBeBeforeNewBlock = this.#lines.findIndex(
      (lines) => lines[0].line_index < newLastLine,
    );

    if (theLineIndexThatShouldBeBeforeNewBlock === -1) {
      throw new Error(
        'this should not be possible as we already checked for this case where the new block should be added at the beginning',
      );
    }

    // Added before `theLineIndexThatShouldBeAfterNewBlock`
    this.#lines.splice(theLineIndexThatShouldBeAfterNewBlock, 0, lines);

    if (this.#lines.length > this.maxSize) {
      // TODO - should remove the one that in the other direction of scrolling
      this.#lines.unshift();
    }
  }

  addBlocks(blocks: Line[][]) {
    for (const block of blocks) {
      this.addLines(block);
    }
  }

  reset() {
    this.#lines = [];
  }

  getLine(lineNumber: number): Line | undefined {
    const linesBlock = this.getLinesBlock(lineNumber);

    if (!linesBlock) {
      return;
    }

    const lineIndexInBlock = lineNumber - linesBlock[0].line_index;

    return linesBlock[lineIndexInBlock];
  }

  isLineExists(lineNumber: number) {
    return this.getLinesBlock(lineNumber) !== undefined;
  }

  getLinesBlock(lineNumber: number) {
    return this.#lines.find(
      (lines) =>
        lines[0].line_index <= lineNumber &&
        lines[lines.length - 1].line_index >= lineNumber,
    );
  }
}
