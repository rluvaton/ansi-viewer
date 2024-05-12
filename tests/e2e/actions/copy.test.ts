import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { copySelectedText, getCopiedText, selectAll } from '../utils/actions';
import { createFixtureFile } from '../utils/fixtures';
import { openElectronApp } from '../utils/render';
import { waitForLineToLoad } from '../utils/wait-helpers';

test.describe('Copy', () => {
  test('should be able to copy the text correctly', async () => {
    const lines = Array.from({ length: 40 }, () => randomUUID());
    const { filePath } = await createFixtureFile({
      content: lines.join('\n'),
    });

    const { page } = await openElectronApp({
      filePath,
    });

    await waitForLineToLoad(page, lines[0]);

    await selectAll(page);
    await copySelectedText(page);

    const copiedText = await getCopiedText(page);

    expect(copiedText).toEqual(lines.join('\n'));
  });
});
