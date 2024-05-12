import { CurrentFileStore } from './current-file-store';
import { CurrentInstanceStore } from './current-instance-store';
import { FileSelectorStore } from './file-selector-store';

class StoreContainer {
  static #instance?: StoreContainer;
  static #abortController: AbortController = new AbortController();

  private _fileSelectorStore: FileSelectorStore;
  private _currentFileStore: CurrentFileStore;
  private _currentInstanceStore: CurrentInstanceStore;

  public get fileSelectorStore(): FileSelectorStore {
    return this._fileSelectorStore;
  }

  public get currentFileStore(): CurrentFileStore {
    return this._currentFileStore;
  }

  public get currentInstanceStore(): CurrentInstanceStore {
    return this._currentInstanceStore;
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
  }

  static reset() {
    StoreContainer.#abortController.abort(new Error('resetting the container'));
    StoreContainer.#abortController = new AbortController();

    StoreContainer.#instance = undefined;
  }
}

export function getContainer(): StoreContainer {
  return StoreContainer.instance;
}

export function resetContainer(): void {
  StoreContainer.reset();
}
