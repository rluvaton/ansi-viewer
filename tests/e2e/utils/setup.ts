import { _electron as electron } from 'playwright';
import { ElectronApplication, Page } from 'playwright-core';

/**
 * Set up utilities for e2e testing, including headless browser configuration.
 * This function opens the Electron app and returns a handle to the app and its main page.
 * It is designed to be used in e2e tests to initialize the app environment.
 */
export async function setupE2ETestingEnvironment(): Promise<{ app: ElectronApplication; page: Page }> {
  const electronApp = await electron.launch({ args: ['electron/main.js'], headless: true });
  const page = await electronApp.firstWindow();
  return { app: electronApp, page };
}
