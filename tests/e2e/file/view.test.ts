import { expect, test } from '@playwright/test';
import { getAllVisibleLinesContent } from '../utils/finders';
import { createFixtureFile } from '../utils/fixtures';
import { openElectronApp } from '../utils/render';

test.describe('File View E2E Tests', () => {
  test('file content is displayed correctly without duplicates', async () => {
    const lines = ['hello world', 'how are you guys?', 'I am fine'];
    const { filePath } = await createFixtureFile({
      content: lines.join('\n'),
    });

    const { page } = await openElectronApp({
      filePath,
    });

    const visibleLines = await getAllVisibleLinesContent(page);

    expect(visibleLines).toEqual(lines);
  });
  //
  // test('file content is displayed correctly without duplicates', async () => {
  //   const { filePath } = await createFixtureFile({
  //     content: 'hello world',
  //   });
  //   // Test implementation to verify file content is displayed correctly without duplicates
  //   // This is a placeholder for the actual test implementation
  //
  //   ({ app, page } = await openElectronApp({
  //     filePath,
  //   }));
  // });

  test('line numbers are accurate and match the content', async () => {
    // Test implementation to ensure line numbers are accurate and match the content
    // This is a placeholder for the actual test implementation
  });
});
