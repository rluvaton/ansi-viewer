import { randomUUID } from 'node:crypto';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

const fixtureCreationFolder = os.tmpdir();
const tmpDir = fsSync.mkdtempSync(
  path.join(fixtureCreationFolder, '/fixtures'),
);

process.once('exit', () => {
  fsSync.rmSync(tmpDir, { recursive: true, force: true });
});

export async function createFixtureFile({
  content,
}: { content: string }): Promise<{
  filePath: string;
}> {
  const filePath = path.join(tmpDir, randomUUID() + '.txt');

  await fs.writeFile(filePath, content);

  return {
    filePath,
  };
}
