import {parseIterator as parseAnsi, ParsedSpan} from "ansicolor";

export type Line = {
    text: string, className: string
}[]


let idCounter = 0;

function generateId() {
    return `colorize-ansi-${idCounter++}`;
}

const commonClassesMap = new Map();

function getClassNameForItemStyle(css: string, styleElement: HTMLStyleElement) {
    if (!css) {
        return;
    }

    let className = commonClassesMap.get(css);

    if (className) {
        return className;
    }

    className = generateId();

    commonClassesMap.set(css, className);

    // This is done to avoid creating a lot of CSS rules which can consume a lot of memory when there are a lot of pre elements
    styleElement.innerHTML += `
pre.${className} {
    ${css}
}`;

    return className;
}


function createCodeHtmlContent(text: string, css: string, styleElement: HTMLStyleElement) {
    const className = getClassNameForItemStyle(css, styleElement);

    return (
        "<pre" +
        (className ? ` class="${className}"` : "") +
        ">" +

        // No worries of XSS here, it's already escaped as we take the html content as is
        text +
        "</pre>"
    );
}

async function buildLinesMap({styleElement, getText, signal}: {
    styleElement: HTMLStyleElement;
    getText: () => string;
    signal: AbortSignal;
}): Promise<Line[]> {
    let i = 0;
    const lines: Line[] = [];
    let currentLine: Line = [];
    const spans = parseAnsi(getText);

    const CHUNK_SIZE = 10000;

    for (const span of spans) {
        if(signal.aborted) {
            throw new Error('Aborted');
        }
        const className = getClassNameForItemStyle(span.css, styleElement);
        const linesInSpan = span.text.split("\n");
        if (linesInSpan.length === 1) {
            currentLine.push({text: span.text, className});
        } else if (linesInSpan.length > 1) {
            currentLine.push({text: linesInSpan[0], className});
            lines.push(currentLine);

            // Without first and last lines so the first line can be combined with the last line of the previous span
            // and the last line can be combined with the first line of the next span
            for (let i = 1; i < linesInSpan.length - 1; i++) {
                lines.push([{text: linesInSpan[i], className}]);
            }

            currentLine = [];

            // If not empty
            if(linesInSpan[linesInSpan.length - 1]) {
                currentLine.push({text: linesInSpan[linesInSpan.length - 1], className});
            }
        }
        i++;

        if (i % CHUNK_SIZE === 0) {
            // Avoid blocking the main thread
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines
}


export async function buildLines({styleElement, text, signal}: {
    styleElement: HTMLStyleElement;
    text: string;
    signal: AbortSignal;
}): Promise<Line[]> {
    // Clear the cache
    idCounter = 0;
    commonClassesMap.clear();
    styleElement.innerHTML = "";

    return await buildLinesMap({
        signal,
        styleElement,
        getText() {
            // should get iterator instead of text so we can clean up the memory
            return text;
        },
    });
}
