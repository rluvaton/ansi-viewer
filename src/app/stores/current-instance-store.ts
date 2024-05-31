import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from 'mobx';
import { Backend } from '../services';

export class CurrentInstanceStore {
  public _refreshKeyNumber = 0;
  #currentWindowId: string;

  public windowInnerHeight = window.innerHeight;
  public windowInnerWidth = window.innerWidth;

  constructor(cleanupSignal: AbortSignal) {
    makeObservable(this, {
      _refreshKeyNumber: observable,
      refreshKey: computed,
      refresh: action,
      windowInnerHeight: observable,
      windowInnerWidth: observable,
    });

    Backend.onSoftRefresh(this.refresh);
    cleanupSignal.addEventListener(
      'abort',
      () => {
        Backend.offSoftRefresh(this.refresh);
      },
      { once: true },
    );

    window.addEventListener(
      'resize',
      () => {
        runInAction(() => {
          this.windowInnerHeight = window.innerHeight;
          this.windowInnerWidth = window.innerWidth;
        });
      },
      { signal: cleanupSignal },
    );

    this.#currentWindowId = Backend.getWindowId();
  }

  refresh = () => {
    this._refreshKeyNumber++;
  };

  get refreshKey(): string {
    return `${this._refreshKeyNumber}`;
  }

  public get currentWindowId(): string {
    return this.#currentWindowId;
  }
}
