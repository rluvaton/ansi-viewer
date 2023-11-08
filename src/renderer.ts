/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import {colorizeAnsi} from "./colorize";

console.log('👋 This message is being logged by "renderer.js", included via Vite');

async function run() {
    const preloadPath = await window.electron.selectFile();
    console.log(preloadPath);

    if (!preloadPath) {
        console.warn('no file selected');
        return;
    }

    const dataIterator = readFile(preloadPath);

    // TODO - remove this after supporting async iterators in the colorizeAnsi function
    let fullContent = '';
    for await (const item of dataIterator) {
        fullContent += item;
    }

    await colorizeAnsi(fullContent);
}

async function* readFile(filePathToRead) {
    console.log('start reading file', filePathToRead)
    await window.electron.preStartReadingFile(filePathToRead);

    // Promise to wait for the next value to be ready
    let resolve;
    let reject;
    let promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    // Values that pile up until the iterator is ready to consume them
    const values = [];

    function fileStreamChunkListener(event, chunk) {
        // TODO - handle errors and back-pressure
        values.push(chunk);
        resolve();
    }

    // Attach the listener before reading the file to avoid missing data
    window.electron.listenToFileChunks(filePathToRead, fileStreamChunkListener);
    window.electron.startReadingFile(filePathToRead);

    while (true) {
        // Waiting for the next value to be ready
        await promise;

        // Reset the promise for the next value
        promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });

        // Copy the values to a new array and clear the original so we won't re-read them
        const valuesCopy = [...values];
        values.length = 0;


        // Yield the values
        for (const value of valuesCopy) {

            // null means we reached the end of the file
            if (value === null) {
                window.electron.cleanupFileChunkListener(filePathToRead, fileStreamChunkListener);

                return;
            }

            yield value;
        }
    }
}

run();


// Number of lines
