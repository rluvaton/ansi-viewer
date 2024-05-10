import { action, makeObservable, observable } from 'mobx';
import { getContainer } from './stores-container';

export class CaretHighlightActionStore {
  isOpen: boolean = false;
  autoHideTimer: NodeJS.Timeout | null = null;
  autoUpdateCaretLocation: NodeJS.Timeout | null = null;
  caretX = 0;
  caretY = 0;

  constructor() {
    makeObservable(this, {
      isOpen: observable,
      caretX: observable,
      caretY: observable,
      autoHideTimer: observable,
      computeCaretLocation: action,
      highlightCurrentLocation: action,
      hide: action,
    });
  }

  highlightCurrentLocation() {
    this.computeCaretLocation();
    this.isOpen = true;

    window.addEventListener('keydown', this.onEscape, {
      signal: getContainer().signal,
    });

    this.autoHideTimer = setTimeout(() => {
      this.hide();
    }, 3000);

    this.autoUpdateCaretLocation = setInterval(() => {
      this.computeCaretLocation();
    }, 100);
  }

  hide() {
    clearTimeout(this.autoHideTimer);
    clearInterval(this.autoUpdateCaretLocation);
    this.isOpen = false;
    window.removeEventListener('keydown', this.onEscape);
  }

  computeCaretLocation() {
    // TODO - can be a problem if container changed
    if (getContainer().signal.aborted) {
      clearInterval(this.autoUpdateCaretLocation);
      return;
    }

    // Reference: https://stackoverflow.com/a/71242140/5923666
    let x = 0;
    let y = 0;
    const selection = window.getSelection();
    // Check if there is a selection (i.e. cursor in place)
    if (selection.rangeCount !== 0) {
      // Clone the range
      const range = selection.getRangeAt(0).cloneRange();
      // Collapse the range to the start, so there are not multiple chars selected
      range.collapse(true);
      // getClientRects returns all the positioning information we need
      const rect = range.getClientRects()[0];
      if (rect) {
        x = rect.left; // since the caret is only 1px wide, left == right
        y = rect.top; // top edge of the caret
      }
    }
    this.caretX = x;
    this.caretY = y;
  }

  private onEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.hide();
    }
  };
}
