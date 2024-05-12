import { Page } from 'playwright';

const isMac = process.platform === 'darwin';

export async function selectAll(page: Page) {
  const modifier = isMac ? 'Meta' : 'Control';

  await page.keyboard.press(`${modifier}+KeyA`);
}

export async function copySelectedText(page: Page) {
  const modifier = isMac ? 'Meta' : 'Control';
  await page.keyboard.press(`${modifier}+KeyC`);
}

export async function getCopiedText(page: Page) {
  return page.evaluate(() => navigator.clipboard.readText());
}
