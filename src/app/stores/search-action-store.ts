import { action, makeObservable, observable } from 'mobx';
import { SearchResult } from '../../shared-types';
import { getContainer } from './stores-container';

export class SearchActionStore {
  isOpen: boolean = false;

  query: string;
  highlightedLocation: SearchResult[] = [];

  constructor() {
    makeObservable(this, {
      isOpen: observable,
      query: observable,

      openSearch: action,
      closeSearch: action,
      updateQuery: action,

      highlightedLocation: observable,
      clearHighlights: action,
      setHighlights: action,
    });
  }

  canSearch() {
    return getContainer().currentFileStore.listInitialized;
  }

  searchNow() {
    // TODO - abort debounce if exist
    if (!this.canSearchQuery(this.query)) {
      return;
    }

    // TODO - this search should be debounced?
    return this.searchInFile(this.query);
  }

  canSearchQuery(query: string): boolean {
    if (!this.canSearch()) {
      return false;
    }

    return query.length > 0;
  }

  async searchInFile(search: string) {
    if (!this.canSearchQuery(search)) {
      // TODO - clear highlights
      this.clearHighlights();
      return;
    }

    // TODO - abort old requests
    const locations = await window.electron.searchInFile(search);

    console.log('searchInFile', locations);

    this.setHighlights(locations);
    // TODO - set highlight

    // TODO - scroll to location of the the first search
    //
    // this.listRef?.current?.scrollTo({
    //   top: y,
    //   left: x,
    // });
  }

  openSearch() {
    this.isOpen = true;

    document.addEventListener('keydown', this.onEscape, {
      signal: getContainer().signal,
    });
  }

  closeSearch() {
    this.isOpen = false;
    document.removeEventListener('keydown', this.onEscape);
  }

  updateQuery(value: string) {
    this.query = value;
  }

  private onEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.closeSearch();
    }
  };

  clearHighlights() {
    this.highlightedLocation = [];
  }

  setHighlights(locations: SearchResult[]) {
    this.highlightedLocation = locations;
  }

  isLineHighlighted(lineNumber: number): boolean {
    return this.highlightedLocation.some(
      (location) =>
        location.start.line <= lineNumber && location.end.line >= lineNumber,
    );
  }

  getHighlightsForLine(lineNumber: number): SearchResult[] {
    // TODO - fix for multi line highlighting
    return this.highlightedLocation.filter(
      (location) =>
        location.start.line <= lineNumber && location.end.line >= lineNumber,
    );

    // TODO - fix multiple highlights on same line
    // TODO - fix multiple highlights that not start at the start of the line but end in the middle and another that start from the middle + something to other lines
  }
}
