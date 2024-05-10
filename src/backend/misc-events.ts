import { BrowserWindow } from "electron";

export async function openGoTo(window: BrowserWindow) {
	// Open the go to menu in the renderer
	window.webContents.send("open-go-to");
}

export async function highlightCaretPosition(window: BrowserWindow) {
	// Highlight the caret position in the renderer
	window.webContents.send("highlight-caret-position");
}
