import { CaretHighlightActionStore } from './caret-highlight-action-store';
import { CurrentFileStore } from './current-file-store';
import { CurrentInstanceStore } from './current-instance-store';
import { FileSelectorStore } from './file-selector-store';
import { GoToActionStore } from './go-to-action-store';
import { SearchActionStore } from './search-action-store';

class StoreContainer {
  static #instance?: StoreContainer;
  static #abortController: AbortController = new AbortController();

  private _fileSelectorStore: FileSelectorStore;
  private _currentFileStore: CurrentFileStore;
  private _currentInstanceStore: CurrentInstanceStore;
  private _goToActionStore: GoToActionStore;
  private _caretHighlightActionStore: CaretHighlightActionStore;
  private _searchActionStore: SearchActionStore;

  public get fileSelectorStore(): FileSelectorStore {
    return this._fileSelectorStore;
  }

  public get currentFileStore(): CurrentFileStore {
    return this._currentFileStore;
  }

  public get currentInstanceStore(): CurrentInstanceStore {
    return this._currentInstanceStore;
  }

  public get goToActionStore(): GoToActionStore {
    return this._goToActionStore;
  }

  public get caretHighlightActionStore(): CaretHighlightActionStore {
    return this._caretHighlightActionStore;
  }

  public get searchActionStore(): SearchActionStore {
    return this._searchActionStore;
  }

  public static get instance(): StoreContainer {
    if (!StoreContainer.#instance) {
      StoreContainer.#instance = new StoreContainer();
      StoreContainer.#instance.init();
    }

    return StoreContainer.#instance;
  }

  private init() {
    StoreContainer.#abortController.abort(new Error('init the container'));
    StoreContainer.#abortController = new AbortController();

    this._currentInstanceStore = new CurrentInstanceStore(
      StoreContainer.#abortController.signal,
    );
    this._fileSelectorStore = new FileSelectorStore(
      StoreContainer.#abortController.signal,
    );
    this._currentFileStore = new CurrentFileStore();
    this._currentFileStore = new CurrentFileStore();
    this._goToActionStore = new GoToActionStore();
    this._caretHighlightActionStore = new CaretHighlightActionStore();
    this._searchActionStore = new SearchActionStore();
  }

  static reset() {
    StoreContainer.#abortController.abort(new Error('resetting the container'));
    StoreContainer.#abortController = new AbortController();

    StoreContainer.#instance = undefined;
  }

  get signal() {
    return StoreContainer.#abortController.signal;
  }
}

export function getContainer(): StoreContainer {
  return StoreContainer.instance;
}

export function resetContainer(): void {
  StoreContainer.reset();
}
