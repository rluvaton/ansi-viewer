import {BrowserWindow, IpcMainEvent} from "electron";

export function getWindowFromEvent(event: IpcMainEvent) {
    return BrowserWindow.getAllWindows().find((win) => win.webContents.id === event.sender.id)
}
