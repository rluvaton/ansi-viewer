import React, {useEffect} from 'react'

import s from './index.module.css';
import {colorizeAnsi} from "../colorize";

interface Props {
    filePath: string;
}

export function AnsiViewerPage({filePath}: Props) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const styleElementRef = React.useRef<HTMLStyleElement>(null);
    console.log(filePath);

    useEffect(() => {
        async function readAndColorizeFile() {
            const dataIterator = readFile(filePath);

            // TODO - remove this after supporting async iterators in the colorizeAnsi function
            let fullContent = '';
            for await (const item of dataIterator) {
                fullContent += item;
            }

            await colorizeAnsi({
                text: fullContent,
                container: containerRef.current,
                styleElement: styleElementRef.current
            });
        }

        readAndColorizeFile();
    }, []);
    return (
        <>
            <style ref={styleElementRef}></style>
            <div ref={containerRef} className={s.ansiContainer}>

            </div>
        </>
    )
}

async function* readFile(filePathToRead: string) {
    console.log('start reading file', filePathToRead)
    await window.electron.preStartReadingFile(filePathToRead);

    // Promise to wait for the next value to be ready
    let resolve: (value: void) => void;
    let reject: (reason?: any) => void;
    let promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    // Values that pile up until the iterator is ready to consume them
    const values: string[] = [];

    function fileStreamChunkListener(_: unknown, chunk: string) {
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

