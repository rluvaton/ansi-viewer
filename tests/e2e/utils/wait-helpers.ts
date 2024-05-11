import { expect } from '@playwright/test';
import { Page } from 'playwright';

export async function waitForLineToLoad(page: Page, line: string | RegExp) {
  await expect(page.getByText(line)).toBeVisible();
}
