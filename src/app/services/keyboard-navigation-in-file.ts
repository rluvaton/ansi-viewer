export function setupKeyboardNavigationInFile() {
  // TODO - change this to only on the ansi viewer and not the whole page
  document.addEventListener('beforeinput', avoidChangingInput);
  document.addEventListener('keydown', skipLineNumber);
}

export function cleanupKeyboardNavigationInFile() {
  document.removeEventListener('beforeinput', avoidChangingInput);
  document.removeEventListener('keydown', skipLineNumber);
}

const STARTING_RETRY_COUNT = 5;

export function setCaretPosition(
  element: HTMLDivElement,
  line: number,
  column: number,
  retryCount = STARTING_RETRY_COUNT,
) {
  const lineContent = document.querySelector(`pre[data-line="${line}"]`);

  if (!lineContent) {
    const sleepTime = (STARTING_RETRY_COUNT - retryCount + 1) * 100;

    console.warn(`line ${line} not found, retrying in ${sleepTime}`);
    // TODO - find a better way - like listen for the line to load or something

    if (retryCount <= 0) {
      console.warn(`reached max retry count looking for line ${line}`);
      return;
    }

    setTimeout(() => {
      setCaretPosition(element, line, column, retryCount - 1);
    }, sleepTime);
    return;
  }

  const lineLength = lineContent.textContent.length;
  column = Math.min(column, lineLength);

  element.focus();

  setCaretPositionInLine(lineContent, column);
}

// Reference: https://stackoverflow.com/a/36953852/5923666
function setCaretPositionInLine(el: Node, column: number) {
  // Loop through all child nodes
  for (const node of el.childNodes) {
    if (node.nodeName !== '#text') {
      column = setCaretPositionInLine(node, column);

      if (column === -1) {
        return -1; // no need to finish the for loop
      }

      continue;
    }

    // Text node
    if (node.length < column) {
      column -= node.length;
      continue;
    }

    // finally add our range
    const range = document.createRange();
    const sel = window.getSelection();
    range.setStart(node, column);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    return -1; // we are done
  }

  return column; // needed because of recursion stuff
}

function avoidChangingInput(e: InputEvent) {
  const target: HTMLElement = e.target as HTMLElement;

  if (target.nodeName === 'PRE' || target.nodeName === 'CODE') {
    e.preventDefault();
    return;
  }

  // Disable changing the content for elements with the data-disable-content-edit attribute
  if (target.getAttribute('data-disable-content-edit') !== null) {
    e.preventDefault();
    return;
  }
}

function skipLineNumber(e: KeyboardEvent) {
  const target: HTMLElement = e.target as HTMLElement;

  // Only run of the lines target
  if (target.getAttribute('data-disable-content-edit') === null) {
    return;
  }

  if (e.key === 'Home') {
    onHome(e);
    return;
  }

  // no need for End key as it can be in the end of the line

  if (e.key === 'ArrowLeft') {
    onArrowLeft(e);
    return;
  }

  if (e.key === 'ArrowRight') {
    onArrowRight(e);
    return;
  }

  // TODO - add arrow down and up when between lines that not the same height have bug
}

function goUpElementsUntilDataLine(element: HTMLElement) {
  let currentElement = element;
  while (
    !currentElement.getAttribute ||
    currentElement.getAttribute('data-line') === null
  ) {
    currentElement = currentElement.parentElement as HTMLPreElement;

    if (currentElement === null || currentElement.nodeName !== 'PRE') {
      return;
    }
  }

  return currentElement;
}

function onHome(e: KeyboardEvent) {
  const range = document.getSelection().getRangeAt(0);

  if (isAlreadyStartOfTheLine(e, range)) {
    e.preventDefault();
    return;
  }

  const lineElement = goUpElementsUntilDataLine(
    range.startContainer as HTMLElement,
  );

  if (!lineElement) {
    console.log('not on child of line element', range);
    return;
  }

  // late update so the page will be moved to the start of the line
  window.requestAnimationFrame(() => {
    document.getSelection().setPosition(lineElement, 0);
  });

  // TODO - what about many updates at really close at time
}

function isAlreadyStartOfTheLine(_e: KeyboardEvent, range: Range) {
  if (range.endOffset > 0) {
    return false;
  }

  let startContainer = range.startContainer as Element;

  if (startContainer.nodeName === '#text') {
    // the content is inside text that is inside pre for each style and wrapped with pre for the line content
    startContainer = (startContainer.parentElement as Element)
      .parentElement as Element;
  }

  const prevElement = startContainer.previousElementSibling;

  if (prevElement === null) {
    return true;
  }

  if (prevElement.nodeName === 'CODE') {
    return true;
  }
  return false;
}

function onArrowLeft(e: KeyboardEvent) {
  // TODO - fix can put cursor on the line number by clicking before the line number
  const range = document.getSelection().getRangeAt(0);

  if (!shouldJumpToEndOfPreviousLine(e, range)) {
    return;
  }

  let startContainer = range.startContainer as Element;

  if (startContainer.nodeName === '#text') {
    // the content is inside text that is inside pre for each style and wrapped with pre for the line content
    startContainer = (startContainer.parentElement as Element)
      .parentElement as Element;
  }

  const prevElement = startContainer.previousElementSibling;

  if (prevElement === null) {
    console.log('reached the start of the file', range);
    console.warn('no prev element, weird');
    return;
  }

  const prevLine = prevElement.parentElement
    .previousElementSibling as HTMLElement;

  if (prevLine === null) {
    // reached the start of the file
    e.preventDefault();
    return;
  }

  document.getSelection().setPosition(prevLine, 0);
}

function shouldJumpToEndOfPreviousLine(_e: KeyboardEvent, range: Range) {
  // TODO - add support for jumping words keyboard shortcut and go to the start of the line or start of the page
  // Not reached the start of the line
  if (range.endOffset > 0) {
    return false;
  }
  // TODO - check that the prev doc is different pre

  let startContainer = range.startContainer as Element;

  if (startContainer.nodeName === '#text') {
    // the content is inside text that is inside pre for each style and wrapped with pre for the line content
    startContainer = (startContainer.parentElement as Element)
      .parentElement as Element;
  }

  const prevElement = startContainer.previousElementSibling;

  if (prevElement === null) {
    console.warn('no prev element, weird');
    return;
  }

  if (prevElement.nodeName !== 'CODE') {
    console.log('reached the start of the line', { prevElement, range });
    return false;
  }

  return true;
}

function onArrowRight(e: KeyboardEvent) {
  // TODO - fix can put cursor on the line number by clicking before the line number
  const range = document.getSelection().getRangeAt(0);

  if (!shouldJumpToStartOfNextLine(e, range)) {
    return;
  }

  const lineElement = goUpElementsUntilDataLine(
    range.endContainer as HTMLElement,
  );

  if (!lineElement) {
    console.log('not a child of line element', range);
    return;
  }

  const nextLine = lineElement.parentElement.nextElementSibling;

  if (nextLine === null) {
    console.log('reached the end of the file', range);

    // reached the end of the file
    e.preventDefault();
    return;
  }

  document.getSelection().setPosition(nextLine, 0);
}

function shouldJumpToStartOfNextLine(_e: KeyboardEvent, range: Range) {
  let endContainer = range.endContainer as Element;

  if (endContainer.nodeName === '#text') {
    // the content is inside text that is inside pre for each style and wrapped with pre for the line content
    endContainer = endContainer.parentElement as Element as Element;
  }

  const nextElement = endContainer.nextElementSibling;

  if (nextElement !== null) {
    // Not the last element in line
    return false;
  }

  if (range.endContainer.nodeName === '#text') {
    return range.endContainer.length === range.endOffset + 1;
  }

  return false;

  // const lineElement = goUpElementsUntilDataLine(range.endContainer as HTMLElement);
  // console.log(`should jump ${lineElement.textContent.length} <= ${range.endOffset} = ${lineElement.textContent.length <= range.endOffset}`, lineElement, range);
  //
  // if(!lineElement) {
  //     console.log('not a child of line element', range);
  //     return false;
  // }
  //
  // if(lineElement.textContent.length <= range.endOffset) {
  //     console.log('reached the end of the line', range, lineElement);
  //     return true;
  // }
  //
  // return false;
}
