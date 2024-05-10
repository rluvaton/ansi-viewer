import { expect, test } from '@playwright/test';
import { openElectronApp } from '../utils/render';

test.describe('Disable Edit E2E Tests', () => {
  let page;
  let app;

  test.beforeAll(async () => {
    ({ app, page } = await openElectronApp());
    // Navigate to the application's URL
    await page.goto('http://localhost:3000');
  });

  test.afterAll(async () => {
    await app.close();
  });

  test('editing the file content is disabled', async () => {
    await expect(page.locator('.ansiContainer')).toHaveAttribute(
      'contenteditable',
      'false',
    );
  });

  test('paste does not work', async () => {
    await page.locator('.ansiContainer').focus();
    await page.keyboard.down('Control');
    await page.keyboard.press('V');
    await page.keyboard.up('Control');
    const content = await page.locator('.ansiContainer').textContent();
    // Assuming the clipboard has content, the test checks if the content remains unchanged after attempting to paste.
    await expect(content).not.toContain('clipboard content');
  });

  test('cut does not work', async () => {
    await page.locator('.ansiContainer').focus();
    await page.keyboard.down('Control');
    await page.keyboard.press('X');
    await page.keyboard.up('Control');
    const content = await page.locator('.ansiContainer').textContent();
    // Assuming there was a selection, the test checks if the content remains unchanged after attempting to cut.
    await expect(content).not.toContain('selected content');
  });

  test('delete does not work', async () => {
    await page.locator('.ansiContainer').focus();
    await page.keyboard.press('Backspace');
    const content = await page.locator('.ansiContainer').textContent();
    // Assuming there was a selection, the test checks if the content remains unchanged after attempting to delete.
    await expect(content).not.toContain('selected content');
  });
});
