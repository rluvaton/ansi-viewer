import { Page } from 'playwright';
import { ElementHandle } from 'playwright-core';

interface GetAllVisibleLinesOptions {
  sortByLines?: boolean;
}

export async function waitForLineToLoad(page: Page, lineNumber: number = 1) {
  await page.waitForSelector(
    `[data-line="${lineNumber}"][role="presentation"]`,
  );
}

export async function getAllVisibleLines(
  page: Page,
  options: GetAllVisibleLinesOptions = {},
) {
  await waitForLineToLoad(page);
  let lines = await page.$$('[data-line][role="presentation"]');

  if (options.sortByLines) {
    const lineToLineNumber = new Map<ElementHandle, number>();

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
