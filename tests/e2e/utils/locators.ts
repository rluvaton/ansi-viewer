import { Locator, Page } from 'playwright';

export function lineBySpecificLineNumberStringLocator(
  lineNumber: number,
): string {
  return `[data-line="${lineNumber}"][role="presentation"]`;
}

export function lineBySpecificLineNumberLocator(
  page: Page,
  lineNumber: number,
): Locator {
  return page.locator(lineBySpecificLineNumberStringLocator(lineNumber));
}

export function lineByText(page: Page, line: string | RegExp): Locator {
  return page.getByText(line);
}
