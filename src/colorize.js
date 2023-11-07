import {parseIterator as parseAnsi} from "ansicolor";


let idCounter = 0;
const commonStyle = document.querySelector('#common-style');
const container = document.querySelector('#container');

function generateId() {
  return `colorize-ansi-${idCounter++}`;
}

const commonClassesMap = new Map();

function getClassNameForItemStyle(item) {
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
  commonStyle.innerHTML += `
pre.${className} {
    ${item.css}
}`;

  return className;
}

function createCodeHtml(item) {
  const className = getClassNameForItemStyle(item);

  return (
    "<pre" +
    (className ? ` class="${className}"` : "") +
    ">" +

    // No worries of XSS here, it's already escaped as we take the html content as is
    item.text +
    "</pre>"
  );
}

async function colorTextHtml({ el, getText }) {
  let i = 0;
  const spans = parseAnsi(getText);

  const CHUNK_SIZE = 10000;
  let childrenChunk = "";

  for (const span of spans) {
    childrenChunk += createCodeHtml(span);
    i++;

    if (i % CHUNK_SIZE === 0) {
      el.innerHTML += childrenChunk;
      childrenChunk = "";

      // Avoid blocking the main thread
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  if (childrenChunk) {
    el.innerHTML += childrenChunk;
  }
}

export async function colorizeAnsi(text) {
  commonStyle.innerHTML = "";
  container.innerHTML = "";

  // TODO - should be already in the index.html as we are in electron app

  await colorTextHtml({
    el: container,
    getText() {
      // should get iterator instead of text so we can clean up the memory
      return text;
    },
  });
}
