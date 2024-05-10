import { _electron as electron } from 'playwright';
import { ElectronApplication, Page } from 'playwright-core';

/**
 * Opens the Electron app and returns a handle to the app and its main page.
 * This utility function is designed to be used in e2e tests to initialize the app environment.
 */
export async function openElectronApp(): Promise<{ app: ElectronApplication; page: Page }> {
  const electronApp = await electron.launch({ args: ['electron/main.js'] });
  const page = await electronApp.firstWindow();
  return { app: electronApp, page };
}
