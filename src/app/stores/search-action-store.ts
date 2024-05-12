import { action, makeObservable, observable } from 'mobx';
import { getContainer } from './stores-container';

export class SearchActionStore {
  isOpen: boolean = false;

  query: string;

  constructor() {
    makeObservable(this, {
      isOpen: observable,
      query: observable,

      openSearch: action,
      closeSearch: action,
      updateQuery: action,
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
    return this.search(this.query);
  }

  canSearchQuery(query: string): boolean {
    if (!this.canSearch()) {
      return false;
    }

    return query.length > 0;
  }

  async search(query: string) {
    if (!this.canSearchQuery(query)) {
      return;
    }

    // TODO - scroll to location of the search
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
}
