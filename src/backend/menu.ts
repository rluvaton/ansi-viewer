import { BrowserWindow, Menu, app } from 'electron';
import { openFile } from './file-handling';

export function setupMainMenu() {
  // setting up the menu with just two items
  const menu = Menu.buildFromTemplate([
    {
      label: 'Menu',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        {
          label: 'Refresh',
          accelerator: 'CmdOrCtrl+R',
          click(_, browser) {
            browser.webContents.send('soft-refresh');
          },
        },
        {
          label: 'Hard Refresh',
          accelerator: 'CmdOrCtrl+Shift+R',
          click(_, browser) {
            browser.reload();
          },
        },
        { type: 'separator' },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          click(_, browser) {
            browser.close();

            // TODO - should do this only if there are no more windows
            if (BrowserWindow.getAllWindows().length === 0) {
              app.quit();
            }
          },
        },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'File',
      submenu: [
        // TODO - add close file
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          // this is the main bit hijack the click event
          async click(_, browser) {
            // TODO - catch missing access errors and open dialog with error
            // TODO - open window with the selected file if no window is open or replace the current one?
            await openFile(browser, false);
          },
        },
      ],
    },
    {
      role: 'window',
      submenu: [
        { role: 'close' },
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
  ]);

  Menu.setApplicationMenu(menu);
}
