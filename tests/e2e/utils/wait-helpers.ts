import { expect } from '@playwright/test';
import { Page } from 'playwright';
import { lineBySpecificLineNumberStringLocator, lineByText } from './locators';

export async function waitForLineToLoad(page: Page, line: string | RegExp) {
  await expect(lineByText(page, line)).toBeVisible();
}

export async function waitForLineNumberToLoad(
  page: Page,
  lineNumber: number = 1,
  options?: { timeout?: number },
) {
  await page.waitForFunction(
    (selector) => {
      const line = document.querySelector(selector);
      return !!line;
    },
    lineBySpecificLineNumberStringLocator(lineNumber),
    options,
  );
}
