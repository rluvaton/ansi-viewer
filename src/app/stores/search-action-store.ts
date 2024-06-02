import { action, makeObservable, observable } from 'mobx';
import { useEffect } from 'react';
import { openGoTo } from '../../backend/misc-events';
import { SearchResult, SearchResults } from '../../shared-types';
import { Backend } from '../services';
import { getRangeForLocation } from '../services/keyboard-navigation-in-file';
import { getContainer } from './stores-container';

// Highlighting idea came from
// https://css-tricks.com/css-custom-highlight-api-early-look/
// TODO - move away from this
// @ts-ignore
const cssHighlight = new Highlight();

// @ts-ignore
CSS.highlights.set('my-custom-highlight', cssHighlight);

export class SearchActionStore {
  isOpen: boolean = false;

  resultNumber: number = 0;
  lastSearchQuery: string;
  query: string;
  searchResults: SearchResult;
  highlightedLocation: SearchResults = [];

  constructor() {
    makeObservable(this, {
      isOpen: observable,
      query: observable,

      openSearch: action,
      closeSearch: action,
      updateQuery: action,

      reset: action,

      searchResults: observable,
      highlightedLocation: observable,
      clearHighlights: action,
      setHighlights: action,
    });
  }

  reset() {
    this.isOpen = false;
    this.query = '';
    this.highlightedLocation = [];
    this.searchResults = undefined;
    this.resultNumber = 0;
    this.lastSearchQuery = undefined;
  }

  canSearch() {
    return getContainer().currentFileStore.listInitialized;
  }

  async searchNow() {
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
    if (this.lastSearchQuery === search) {
      // go to next result
      this.resultNumber =
        (this.resultNumber + 1) % this.highlightedLocation.length;
      getContainer().goToActionStore.goTo(
        this.highlightedLocation[this.resultNumber].line_number,
        this.highlightedLocation[this.resultNumber].column,
      );
      return;
    }
    this.lastSearchQuery = search;
    if (!this.canSearchQuery(search)) {
      // TODO - clear highlights
      this.clearHighlights();
      return;
    }

    // TODO - abort old requests

    // TODO - get Math.min(search results, visible lines * 5, 100)
    //        get the number of results anyway
    //        change ack to allow getting from specific line numbers
    //        get number of search results
    const locations = await Backend.searchInFile(
      getContainer().fileSelectorStore.currentFilePath,
      search,
    );

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
    cssHighlight.clear();
  }

  setHighlights(locations: SearchResults) {
    this.highlightedLocation = locations;
    this.rerenderHighlights();
  }

  isLineHighlighted(lineNumber: number): boolean {
    const numberOfLines = this.query.split('\n').length - 1;
    return this.highlightedLocation.some(
      (location) =>
        location.line_number <= lineNumber &&
        location.line_number + numberOfLines >= lineNumber,
    );
  }

  getHighlightsForLine(lineNumber: number): SearchResults {
    const numberOfLines = this.query.split('\n').length - 1;
    // TODO - fix for multi line highlighting
    return this.highlightedLocation.filter(
      (location) =>
        location.line_number <= lineNumber &&
        location.line_number + numberOfLines >= lineNumber,
    );

    // TODO - fix multiple highlights on same line
    // TODO - fix multiple highlights that not start at the start of the line but end in the middle and another that start from the middle + something to other lines
  }

  rerenderHighlights() {
    // TODO - only highlight visible lines
    // TODO - get Math.min(search results, visible lines * 5, 100)
    //        get the number of results anyway
    //        change ack to allow getting from specific line numbers
    //        get number of search results
    // cssHighlight.delete(range);
    cssHighlight.clear();
    // TODO - move to parent, dont do in each line
    if (this.highlightedLocation.length === 0) {
      cssHighlight.clear();
      return;
    }

    this.resultNumber = 0;
    getContainer().goToActionStore.goTo(
      this.highlightedLocation[this.resultNumber].line_number,
      this.highlightedLocation[this.resultNumber].column,
    );

    const highlights = this.highlightedLocation
      .map((highlight) => {
        const start = getRangeForLocation(highlight);
        const endLocation = { ...highlight };
        const lines = this.query.split('\n');
        endLocation.line_number += lines.length - 1;
        endLocation.column = lines.at(-1).length;

        const end = getRangeForLocation(endLocation);

        if (!start || !end) {
          return undefined;
        }

        start.setEnd(end.endContainer, end.endOffset);

        return start;
      })
      .filter(Boolean) as Range[];

    console.log(highlights);

    for (const range of highlights) {
      cssHighlight.add(range);
    }

    // TODO - on line into view should highlight it
  }
}
