import {BrowserWindow, IpcMainEvent, IpcMainInvokeEvent} from "electron";

export function getWindowFromEvent(event: IpcMainEvent | IpcMainInvokeEvent) {
    return BrowserWindow.getAllWindows().find((win) => win.webContents.id === event.sender.id)
}
