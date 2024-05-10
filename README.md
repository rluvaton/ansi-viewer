# electron-ansi-viewer
Performant low memory footprint ANSI viewer

Available as [Chrome extension](https://chromewebstore.google.com/detail/colorize-ansi/hjohibofdldajbdngfdieklopkjhplck) as well


## Why?

### Why not just use the extension above?
You should. I do. But not for large files (around 100 MB) as the browser is too slow and can crash **before even finishing loading the page** so the browser extension can't even start

### But Electron is running a browser, so how can it handle that
Because we don't render the entire file

### Why not some VS Code extension?
You can use the existing extension but it won't work for files larger than 50MB due to [VS Code limitation](https://github.com/microsoft/vscode/issues/32118)

### Why in Electron? JavaScript is not the fastest
I tried creating the app in Swift and making it MacOS only if it would be better for performance

but whenever I tried to load a file around 5MB it just used too much memory and I don't have much experience with Swift to use Swift-specific optimization

### So Why it takes too long to open a single file
This is one of the things I still need to fix, I should parse as I read the file for fast opening 

### So why it's performant?
Because once you load, we use [virtualization](https://www.kirupa.com/hodgepodge/ui_virtualization.htm) to render only what you see and then some

### But what about the memory?
Great question, To avoid using a lot of memory we split the lines that needed to be displayed into _blocks_ (currently 100 lines)
and when you are scrolling and near the next block we request to get those lines as well

Each block is compressed so it won't take much memory, and when requesting the next block of lines we decompress it and then in the background uncompress the next 10 blocks

The reason we decompress the next blocks in the background is so that if the user keeps scrolling they won't need to wait for the blocks

## Limitations
1. Only files below 1GB are supported at the moment (as we read the full file into memory instead of using streams, we should use streams both for memory consumption and faster opening time)

## New Search Functionality
The application now supports a powerful search functionality that allows users to search through the entire content of the ANSI file, not just what is currently loaded or displayed. This feature is designed to enhance the user experience by providing a more efficient way to locate specific information within large files.

### How to Use the Search Feature
- To initiate a search, simply enter your search query in the search input field located at the top of the application window.
- Press the "Search" button or hit "Enter" to start the search.
- The search results will be displayed in a list, showing the line numbers and snippets of text where the search term was found.
- Click on a search result to navigate directly to the corresponding location in the file.

### Keyboard Shortcuts
- `Ctrl+F` / `Cmd+F`: Open the search input field to type your query.
- `Enter`: Start the search after typing your query.
- `Esc`: Close the search results and return to the file view.

This search functionality is designed to make it easier for users to find the information they need within large ANSI files, improving the overall efficiency of navigating through the file content.
