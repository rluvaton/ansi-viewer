import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { SearchResult } from '../../shared-types';

const patchedAgPath = '/Users/rluvaton/dev/open-source/the_silver_searcher/ag';

export async function searchInFile(
  filePath: string,
  query: string,
): Promise<SearchResult[]> {
  const ackMateResult = await internalSearch(filePath, query);

  console.log('ackMateResult', ackMateResult);

  const searchResults = parseAckMateResult(ackMateResult);

  return searchResults;
}

async function internalSearch(
  filePath: string,
  query: string,
): Promise<string> {
  const childProcess = spawn(patchedAgPath, [
    // Don't print the matches so the AckMate format will be smaller
    '--no-print-matches',

    // Search like there are no ansi codes in the file (like it's a plain text file) so the location will be different but would work for the frontend
    '--strip-ansi-codes',

    // Don't treat the query as a RegEx
    // TODO - add support for regex
    '--literal',

    // Disable multiline search until Regex is supported
    // TODO - the format for the output will be different for multiline matches, see the end of the file for example
    '--no-multiline',

    // Make the query case insensitive
    '--ignore-case',

    // output in ACKMate format
    // ref for the format:
    // https://github.com/BurntSushi/ripgrep/issues/244#issuecomment-262225157
    '--ackmate',
    query,
    filePath,
  ]);

  // TODO - convert the return result to be stream so can find immediately the first result
  return childProcess.stdout.reduce((acc, line) => {
    return acc + line.toString();
  }, '');
}

function parseAckMateResult(ackMateResult: string): SearchResult[] {
  const lines = ackMateResult.split('\n');

  const searchResults: SearchResult[] = [];

  for (const line of lines) {
    // Empty line
    if (!line.trim()) {
      continue;
    }

    // Example line:
    // 178;0 4,429 4:
    // for line 178 there are 2 matches in the line: 0 and 429 each match is 4 characters long
    const [matchesInSingleLine] = line.split(':');
    assert(matchesInSingleLine, 'Expected to have matches in the line');

    // TODO - fix matches that cross multiple lines
    //        For matches between multiple line there will be first be the the following line number and then the column and length of the match

    const [lineNumberAsStr, rest] = matchesInSingleLine.split(';');
    assert(lineNumberAsStr, 'Expected to have line number as string');
    assert(rest, 'Expected to have column and length of matches in the line');

    const lineNumber = parseInt(lineNumberAsStr, 10);

    const matchesInLine = rest.split(',');

    for (const singleMatch of matchesInLine) {
      const [columnAsStr, lengthAsStr] = singleMatch.split(' ');
      assert(columnAsStr, 'Expected to have column');
      assert(lengthAsStr, 'Expected to have length');

      const column = parseInt(columnAsStr, 10);
      const length = parseInt(lengthAsStr, 10);

      searchResults.push({
        start: {
          line: lineNumber,
          column,
        },

        // TODO - what about matches between lines
        end: {
          line: lineNumber,
          column: column + length,
        },
      });
    }
  }

  return searchResults;
}

// TODO - multi line matches
// For multi line matches
// there will be a line number without any matches, for example 604 which mean the it start at that line
// and then the next lines will be the matches and the column will be relative to the start of line without any column in it
// so 606 results is 7724 columns since the start of line 604
// 604;
// 605;3860 10:
// 606;7724 10:
// 607;11588 10:
// 609;
// 610;3858 10:
// 611;7722 10:
// 612;11586 10:
