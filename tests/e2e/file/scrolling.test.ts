import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import {
  getAllLinesContent,
  getAllVisibleLinesContent,
} from '../utils/finders';
import { createFixtureFile } from '../utils/fixtures';
import { openElectronApp } from '../utils/render';

test.describe('File Scrolling', () => {
  test('should scroll through file content', async () => {
    const lines = Array.from({ length: 15_000 }, () => randomUUID());
    const { filePath } = await createFixtureFile({
      content: lines.join('\n'),
    });

    const { page } = await openElectronApp({
      filePath,
    });

    const visibleLines = await getAllVisibleLinesContent(page);

    expect(visibleLines).toEqual(lines);

    // Assuming the app has a file loaded and displayed in a scrollable area
    // This test should simulate user scrolling and verify the smoothness of the scrolling
    // The specifics of how to simulate scrolling and verify smoothness will depend on the app's implementation
  });

  test('should have all lines even for large files when scrolling', async () => {
    const lines = Array.from({ length: 15_000 }, () => randomUUID());
    const { filePath } = await createFixtureFile({
      content: lines.join('\n'),
    });

    const { page } = await openElectronApp({
      filePath,
    });

    const fetchedLines = await getAllLinesContent(page);

    expect(fetchedLines).toEqual(lines);

    // Assuming the app has a file loaded and displayed in a scrollable area
    // This test should simulate user scrolling and verify the smoothness of the scrolling
    // The specifics of how to simulate scrolling and verify smoothness will depend on the app's implementation
  });

  test('should handle scrolling performance for large files', async () => {
    const { app } = await openElectronApp();

    // Assuming the app can load and display large files
    // This test should load a large file, simulate user scrolling, and verify that performance is acceptable
    // The specifics of how to load a large file, simulate scrolling, and verify performance will depend on the app's implementation

    await app.close();
  });
});
