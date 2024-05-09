import {BrowserWindow} from "electron";
import {OpenedFileState} from "./ansi-file/open-file-state";
import {FileParsedEvent} from "../shared-types";


export async function openGoTo(window: BrowserWindow, requestedFromClient: boolean) {
    // Open the go to menu in the renderer
    window.webContents.send('open-go-to');
}

