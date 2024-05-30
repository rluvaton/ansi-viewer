import fs from 'fs';

import { startFlow } from 'lighthouse';
import puppeteer from 'puppeteer';

import { findLatestBuild, parseElectronApp } from 'electron-playwright-helpers';

process.env.INSIDE_PUPPETEER = 'true';

/**
 * Opens the Electron app and returns a handle to the app and its main page.
 * This utility function is designed to be used in e2e tests to initialize the app environment.
 */
// export async function openElectronApp({
//   filePath,
// }: { filePath?: string } = {}) {
//
//   electronApp.process().stdout.pipe(process.stdout);
//   electronApp.process().stderr.pipe(process.stderr);
//
//   electronApp.on('window', async (page) => {
//     const filename = page.url()?.split('/').pop();
//     console.log(`Window opened: ${filename}`);
//
//     // capture errors
//     page.on('pageerror', (error) => {
//       console.error(error);
//     });
//     // capture console messages
//     page.on('console', (msg) => {
//       console.log(msg.text());
//     });
//   });
//
//   return electronApp.w();
// }

async function openApplication({ filePath } = {}) {
  // find the latest build in the out directory
  const latestBuild = findLatestBuild();
  // parse the directory and find paths and other info
  const appInfo = parseElectronApp(latestBuild);
  // set the CI environment variable to true
  process.env.CI = 'e2e';
  const electronApp = await puppeteer.launch({
    // TODO - fix spaces
    args: [
      appInfo.main,
      '--log-dest=stdout',
      filePath ? `--file=${filePath}` : '',
    ].filter(Boolean),
    executablePath: appInfo.executable,
  });
  //
  // const response = await fetch(
  //   `http://localhost:8315/json/versions/list?t=${Math.random()}`,
  // );
  // const debugEndpoints = await response.json();
  //
  // const webSocketDebuggerUrl = debugEndpoints['webSocketDebuggerUrl '];
  //
  // const browser = await puppeteer.connect({
  //   browserWSEndpoint: webSocketDebuggerUrl,
  // });

  return electronApp;
}

async function captureReport() {
  // const page = await openElectronApp();
  const browser = await openApplication({
    filePath:
      '/Users/rluvaton/dev/personal/ansi-viewer/examples/fixtures/tiny.ans',
  });
  const [page] = await browser.pages();
  // Get a session handle to be able to send protocol commands to the page.
  const session = await page.createCDPSession();

  const flow = await startFlow(page, {
    name: 'Open tiny file - 4MB',
  });

  // Regular Lighthouse navigation.
  // Navigate and scroll timespan.
  await flow.startTimespan({ name: 'Scroll' });
  // We need the ability to scroll like a user. There's not a direct puppeteer function for this, but we can use the DevTools Protocol and issue a Input.synthesizeScrollGesture event, which has convenient parameters like repetitions and delay to somewhat simulate a more natural scrolling gesture.
  // https://chromedevtools.github.io/devtools-protocol/tot/Input/#method-synthesizeScrollGesture
  await session.send('Input.synthesizeScrollGesture', {
    x: 100,
    y: 600,
    yDistance: -2500,
    speed: 1000,
    repeatCount: 20,
    repeatDelayMs: 250,
  });
  await flow.endTimespan();

  await browser.close();

  const report = await flow.generateReport();

  fs.writeFileSync('flow.report.html', report);
  // open('flow.report.html', { wait: false });
}

captureReport();
