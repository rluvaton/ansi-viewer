import {parseIterator as parseAnsi, ParsedSpan} from "ansicolor";

let idCounter = 0;

function generateId() {
    return `colorize-ansi-${idCounter++}`;
}

const commonClassesMap = new Map();

function getClassNameForItemStyle(item: ParsedSpan, styleElement: HTMLStyleElement) {
    if (!item.css) {
        return;
    }

    let className = commonClassesMap.get(item.css);

    if (className) {
        return className;
    }

    className = generateId();

    commonClassesMap.set(item.css, className);

    // This is done to avoid creating a lot of CSS rules which can consume a lot of memory when there are a lot of pre elements
    styleElement.innerHTML += `
pre.${className} {
    ${item.css}
}`;

    return className;
}

function createCodeHtml(item: ParsedSpan, styleElement: HTMLStyleElement) {
    const className = getClassNameForItemStyle(item, styleElement);

    return (
        "<pre" +
        (className ? ` class="${className}"` : "") +
        ">" +

        // No worries of XSS here, it's already escaped as we take the html content as is
        item.text +
        "</pre>"
    );
}

async function colorTextHtml({container, styleElement, getText}: {
    container: HTMLElement;
    styleElement: HTMLStyleElement;
    getText: () => string;
}) {
    let i = 0;
    const spans = parseAnsi(getText);

    const CHUNK_SIZE = 10000;
    let childrenChunk = "";

    for (const span of spans) {
        childrenChunk += createCodeHtml(span, styleElement);
        i++;

        if (i % CHUNK_SIZE === 0) {
            container.innerHTML += childrenChunk;
            childrenChunk = "";

            // Avoid blocking the main thread
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
    }

    if (childrenChunk) {
        container.innerHTML += childrenChunk;
    }
}


export async function colorizeAnsi({container, styleElement, text}: {
    container: HTMLElement;
    styleElement: HTMLStyleElement;
    text: string;
}) {
    styleElement.innerHTML = "";
    container.innerHTML = "";

    // TODO - should be already in the index.html as we are in electron app

    await colorTextHtml({
        container,
        styleElement,
        getText() {
            // should get iterator instead of text so we can clean up the memory
            return text;
        },
    });
}
