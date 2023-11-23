# electron-ansi-viewer

Performant low memory footprint ANSI viewer

Available as [Chrome extension](https://chromewebstore.google.com/detail/colorize-ansi/hjohibofdldajbdngfdieklopkjhplck)
as well

## Why?

### Why not just use the extension above?

You should. I do. But not for large files (around 100 MB) as the browser is too slow and can crash **before even
finishing loading the page** so the browser extension can't even start

### But Electron is running a browser, so how can it handle that

Because we don't render the entire file

### Why not some VS Code extension?

You can use the existing extension but it won't work for files larger than 50MB due
to [VS Code limitation](https://github.com/microsoft/vscode/issues/32118)

### Why in Electron? JavaScript is not the fastest

I tried creating the app in Swift and making it MacOS only if it would be better for performance

but whenever I tried to load a file around 5MB it just used too much memory and I don't have much experience with Swift
to use Swift-specific optimization

### So why when I scroll past 1000 lines in huge file I don't see anything at the first couple of seconds

Currently, in order to support fast opening of the file we load the first 10 blocks of lines (100 lines each) and in the background load the rest of the file

I still need to fix it to not take too long AND to not load into memory the entire file (even compressed)

### So why it's performant?

Because once you load, we use [virtualization](https://www.kirupa.com/hodgepodge/ui_virtualization.htm) to render only
what you see and then some

### But what about the memory?

Great question, To avoid using a lot of memory we split the lines that needed to be displayed into _blocks_ (currently
100 lines)
and when you are scrolling and near the next block we request to get those lines as well

Each block is compressed so it won't take much memory, and when requesting the next block of lines we decompress it and
then in the background uncompress the next 10 blocks

The reason we decompress the next blocks in the background is so that if the user keeps scrolling they won't need to
wait for the blocks

## Limitations

1. Slow full large file loading (see above)
2. No search
3. Keeping in memory the file (compressed but still) so it's not good for large files

------

### Memory footprint

> For the memory usage I used [`psrecord`](https://github.com/astrofrog/psrecord) for the application pid with all children combined

| File size                                | Memory usage |
|------------------------------------------|--------------|
| no file opened<br/> (just electron base) | 300 MB       |
| ~1 KB file                               | 319 MB       |
| ~5 MB file                               | 384 MB       |
| ~65 MB file                              | 450 MB       |
| ~150 MB file                             | 480 MB       |
| ~330 MB file                             | 630 MB       |
| ~1GB MB file                             | 1100 MB      |

