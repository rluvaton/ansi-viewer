import { ElectronApplication, Page, _electron as electron } from 'playwright';

import { test } from '@playwright/test';
import { findLatestBuild, parseElectronApp } from 'electron-playwright-helpers';

let electronApp: ElectronApplication;

/**
 * Opens the Electron app and returns a handle to the app and its main page.
 * This utility function is designed to be used in e2e tests to initialize the app environment.
 */
export async function openElectronApp({
  filePath,
}: { filePath?: string } = {}): Promise<{
  app: ElectronApplication;
  page: Page;
}> {
  if (electronApp) {
    throw new Error('App is already open');
  }
  // find the latest build in the out directory
  const latestBuild = findLatestBuild();
  // parse the directory and find paths and other info
  const appInfo = parseElectronApp(latestBuild);
  // set the CI environment variable to true
  process.env.CI = 'e2e';
  electronApp = await electron.launch({
    // TODO - fix spaces
    args: [
      appInfo.main,
      '--log-dest=stdout',
      filePath ? `--file=${filePath}` : '',
    ].filter(Boolean),
    executablePath: appInfo.executable,
  });
  electronApp.process().stdout.pipe(process.stdout);
  electronApp.process().stderr.pipe(process.stderr);

  electronApp.on('window', async (page) => {
    const filename = page.url()?.split('/').pop();
    console.log(`Window opened: ${filename}`);

    // capture errors
    page.on('pageerror', (error) => {
      console.error(error);
    });
    // capture console messages
    page.on('console', (msg) => {
      console.log(msg.text());
    });
  });

  const page = await electronApp.firstWindow();
  return { app: electronApp, page };
}

// TODO - fix this function to be better and also flush logs correctly
test.afterEach(async () => {
  return new Promise<void>((resolve) => {
    if (!electronApp) {
      resolve();
      return;
    }
    let app = electronApp;
    const abortWaitTimer = setTimeout(() => {
      console.log('took too much time to flush');
      onDrain();
    }, 300);

    function onDrain() {
      clearTimeout(abortWaitTimer);
      if (app) {
        app.process().stdout.off('drain', onDrain);
        app.process().stderr.off('drain', onDrain);
        app.close();
      }
      app = undefined;
      resolve();
    }

    app.process().stdout.once('drain', onDrain);
    app.process().stderr.once('drain', onDrain);
    electronApp = undefined;
  });
});
