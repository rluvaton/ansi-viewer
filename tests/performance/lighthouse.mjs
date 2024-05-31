import fs from 'node:fs/promises';
import open from 'open';
import prettyBytes from 'pretty-bytes';

import { startFlow } from 'lighthouse';
import puppeteer from 'puppeteer';

import { findLatestBuild, parseElectronApp } from 'electron-playwright-helpers';

process.env.INSIDE_PUPPETEER = 'true';

// process.env.NODE_ENV = 'development';

function lineBySpecificLineNumberStringLocator(lineNumber) {
  return `[data-line="${lineNumber}"][role="presentation"]`;
}

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
      //
      appInfo.main,
      // '--log-dest=file',
      filePath ? `--file=${filePath}` : '',
    ].filter(Boolean),
    executablePath: appInfo.executable,
  });

  return electronApp;
}

async function captureReport({ filePath, name, cbs = [] }) {
  // const page = await openElectronApp();
  const browser = await openApplication();
  const [page] = await browser.pages();
  // Get a session handle to be able to send protocol commands to the page.
  const session = await page.createCDPSession();

  const flow = await startFlow(page, {
    name: name,
  });

  await flow.startTimespan({ name: 'Open file' });
  await page.evaluate((filePath) => {
    console.log('file', filePath);
    const event = new CustomEvent('tests-custom-file-select', {
      detail: {
        filePath,
      },
    });

    // Dispatch the event.
    window.dispatchEvent(event);
  }, filePath);

  await page.waitForSelector(lineBySpecificLineNumberStringLocator(1));
  await flow.endTimespan();

  for (const cb of cbs) {
    await cb({ session, flow });
  }

  await browser.close();

  const report = await flow.generateReport();

  return report;
}

async function run(filePath) {
  const { size: fileSize } = await fs.stat(filePath);
  const prettySize = prettyBytes(fileSize);
  console.log(`Running for file in size ${prettySize}`);
  const report = await captureReport({
    name: `Open file - ${prettySize}`,
    filePath,
    cbs: [
      async ({ session, flow }) => {
        await flow.startTimespan({ name: 'Medium scroll' });
        // We need the ability to scroll like a user. There's not a direct puppeteer function for this, but we can use the DevTools Protocol and issue a Input.synthesizeScrollGesture event, which has convenient parameters like repetitions and delay to somewhat simulate a more natural scrolling gesture.
        // https://chromedevtools.github.io/devtools-protocol/tot/Input/#method-synthesizeScrollGesture
        await session.send('Input.synthesizeScrollGesture', {
          x: 100,
          y: 600,
          yDistance: -2500,
          speed: 1000,
          repeatCount: 0,
          repeatDelayMs: 50,
        });
        await flow.endTimespan();
      },

      async ({ session, flow }) => {
        await flow.startTimespan({ name: 'Fast scroll' });
        // We need the ability to scroll like a user. There's noit a direct puppeteer function for this, but we can use the DevTools Protocol and issue a Input.synthesizeScrollGesture event, which has convenient parameters like repetitions and delay to somewhat simulate a more natural scrolling gesture.
        // https://chromedevtools.github.io/devtools-protocol/tot/Input/#method-synthesizeScrollGesture
        await session.send('Input.synthesizeScrollGesture', {
          x: 100,
          y: 600,
          yDistance: -2500,
          speed: 500,
          repeatCount: 20,
          repeatDelayMs: 10,
        });
        await flow.endTimespan();
      },
      async ({ session, flow }) => {
        await flow.startTimespan({ name: 'Super Fast scroll' });
        // We need the ability to scroll like a user. There's not a direct puppeteer function for this, but we can use the DevTools Protocol and issue a Input.synthesizeScrollGesture event, which has convenient parameters like repetitions and delay to somewhat simulate a more natural scrolling gesture.
        // https://chromedevtools.github.io/devtools-protocol/tot/Input/#method-synthesizeScrollGesture
        await session.send('Input.synthesizeScrollGesture', {
          x: 100,
          y: 600,
          yDistance: -10000,
          speed: 5000,
          repeatCount: 20,
          repeatDelayMs: 0,
        });
        await flow.endTimespan();
      },
    ],
  });

  await fs.writeFile('flow.report.html', report);
  await open('flow.report.html', { wait: false });
}

// process.args

const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide a file path');
  process.exit(1);
}

const fileExists = fs
  .access(filePath)
  .then(() => true)
  .catch(() => false);
if (!fileExists) {
  console.error('File does not exist');
  process.exit(1);
}

const isFile = fs.stat(filePath).then((stat) => stat.isFile());

if (!isFile) {
  console.error('Path is not a file');
  process.exit(1);
}

await run(filePath);
