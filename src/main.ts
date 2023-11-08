import {app, BrowserWindow, dialog, ipcMain, Menu} from "electron";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import {createReadStream} from "node:fs";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

let mainWindow: BrowserWindow;

const createWindow = () => {
    setMainMenu();

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

};

function setMainMenu() {

    // setting up the menu with just two items
    const menu = Menu.buildFromTemplate([
        {
            label: 'Menu',
            submenu: [
                {
                    label: 'Close',
                    accelerator: 'CmdOrCtrl+W',
                    click(_, browser) {
                        browser.close()

                        // TODO - should do this only if there are no more windows
                        if (BrowserWindow.getAllWindows().length === 0) {
                            app.quit()
                        }
                    }
                },
                {
                    label: 'Exit',
                    accelerator: 'CmdOrCtrl+Q',
                    click() {
                        app.quit()
                    }
                }
            ]
        },
        {
            label: 'File',
            submenu: [
                // TODO - add close file
                {
                    label: 'Open File',
                    accelerator: 'CmdOrCtrl+O',
                    // this is the main bit hijack the click event
                    click() {
                        // TODO - notify the client that file has been selected
                    }
                }
            ]
        },
    ])
    Menu.setApplicationMenu(menu)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// TODO - listen for scroll events/search and send them to the renderer

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.


ipcMain.handle('select-file', async () => {
    // TODO - remove this
    const defaultPath = '/Users/rluvaton/dev/personal/ansi-viewer/examples'

    try {
        const result = await dialog.showOpenDialog({properties: ['openFile'], defaultPath: defaultPath});
        if (result.canceled) {
            console.log('canceled');
            return undefined;
        }
        return result.filePaths[0];
    } catch (err) {
        console.error('Failed to get file', err);
        return undefined
    }
});

ipcMain.handle('pre-start-reading-file', async (event, filePath) => {
    // Make sure the path:
    // - exists
    // - a file
    // - have read access

    if (!filePath) {
        throw new Error('no file path provided');
    }

    let fileStats;

    try {
        fileStats = await fs.stat(filePath);
    } catch (e) {
        if (e.code === 'ENOENT') {
            throw new Error('file not found');
        }

        console.error('failed to get file stats', e);
        throw new Error('Failed to get file');
    }

    if (!fileStats.isFile()) {
        throw new Error('not a file');
    }

    try {
        await fs.access(filePath, fs.constants.R_OK);
    } catch (e) {
        throw new Error('Access denied');
    }

    return true;
});

ipcMain.on('read-file-stream', async (event, filePath) => {
    console.log('read-file-stream', filePath)
    mainWindow.setRepresentedFilename(filePath);

    const eventNameForFileStreamChunks = `read-file-stream-${filePath}`

    // TODO
    //  - add back pressure
    //  - if no ping than clean up so we don't have memory leak
    //  - add error handling
    //  - add cancellation

    const stream = createReadStream(filePath)
    try {
        for await (const chunk of stream) {
            console.log('chunk')
            event.sender.send(eventNameForFileStreamChunks, chunk.toString())
        }

        console.log('finish')
        event.sender.send(eventNameForFileStreamChunks, null)
    } catch (e) {
        console.error('failed to read file', e)
        // TODO - send error
        event.sender.send(eventNameForFileStreamChunks, null)
    }
})
