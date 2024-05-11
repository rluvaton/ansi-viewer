import { expect } from '@playwright/test';
import { Page } from 'playwright';
import { ElementHandle } from 'playwright-core';
import { scroll } from './core';

interface GetAllVisibleLinesOptions {
  sortByLines?: boolean;
  linesMap?: Map<ElementHandle, number>;
  returnOnlyMissingLinesMap?: boolean;
}

interface GetAllLinesOptions {
  numberOfLines?: number;
}

async function waitForLineNumberToLoad(page: Page, lineNumber: number = 1) {
  await page.waitForFunction(
    (lineNumber) => {
      const line = document.querySelector(
        `[data-line="${lineNumber}"][role="presentation"]`,
      );
      return !!line;
    },
    lineNumber,
    {
      timeout: 1000,
    },
  );
}

export async function getAllVisibleLines(
  page: Page,
  options: GetAllVisibleLinesOptions = {},
) {
  await waitForLineNumberToLoad(page);
  // await page.waitForTimeout(100);
  let lines = await page.$$('[data-line][role="presentation"]');

  if (options.returnOnlyMissingLinesMap && options.linesMap) {
    lines = lines.filter((line) => !options.linesMap.has(line));
  }

  if (options.sortByLines) {
    const lineToLineNumber =
      options.linesMap ?? new Map<ElementHandle, number>();

    for (const line of lines) {
      const lineNumber = parseInt(
        (await line.getAttribute('data-line')) ?? '',
        10,
      );
      lineToLineNumber.set(line, lineNumber);
    }

    lines = lines.toSorted(
      (line1, line2) =>
        lineToLineNumber.get(line1) - lineToLineNumber.get(line2),
    );
  }

  return lines;
}

export async function getAllVisibleLinesContent(
  page: Page,
  { sortByLines = true, ...options }: GetAllVisibleLinesOptions = {},
) {
  return Promise.all(
    (await getAllVisibleLines(page, { sortByLines, ...options })).map((item) =>
      item.innerText(),
    ),
  );
}

export async function getAllLinesContent(
  page: Page,
  options: GetAllLinesOptions = {},
): Promise<string[]> {
  let allLines: string[] = [];

  let prevSize: number;

  await page.waitForTimeout(100);
  await waitForLineNumberToLoad(page);
  const pageSize = await page.evaluate(() => window.innerHeight);
  // TODO - fix page size is 0 sometimes
  const scrollY = pageSize === 0 ? 100 : Math.trunc((pageSize * 9) / 10);
  do {
    prevSize = allLines.length;

    let selectorText: string;

    if (allLines.length === 0) {
      selectorText = `[data-outer-line] > [data-line][role="presentation"]`;
    } else {
      selectorText = `[data-outer-line="${allLines.length}"] ~ [data-outer-line] > [data-line][role="presentation"]`;
    }

    const lines = await page.locator(selectorText).allInnerTexts();

    allLines = allLines.concat(lines);

    if (allLines.length === prevSize) {
      // TODO - find
      try {
        await waitForLineNumberToLoad(page, allLines.length + 1);
      } catch (e) {
        // Reached end?
        break;
      }
      const lines = await page.locator(selectorText).allInnerTexts();

      allLines = allLines.concat(lines);
    }

    await scroll(page, {
      deltaX: 0,
      deltaY: scrollY,
      wait: 10,
      // TODO - disable wait and wait manually for next line
    });
  } while (allLines.length !== prevSize);

  return allLines;
}
