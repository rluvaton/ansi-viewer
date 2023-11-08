import {action, computed, makeObservable, observable} from "mobx";

export class CurrentInstanceStore {
    public _refreshKeyNumber = 0;
    #currentWindowId: number;

    constructor(cleanupSignal: AbortSignal) {
        makeObservable(this, {
            _refreshKeyNumber: observable,
            refreshKey: computed,
            refresh: action,
        });

        window.electron.onSoftRefresh(this.refresh);
        cleanupSignal.addEventListener('abort', () => {
            window.electron.offSoftRefresh(this.refresh);
        }, {once: true});

        this.#currentWindowId = window.electron.getWindowId();
    }

    refresh = () => {
        this._refreshKeyNumber++;
    }

    get refreshKey(): string {
        return `${this._refreshKeyNumber}`;
    }

    public get currentWindowId(): number {
        return this.#currentWindowId;
    }
}
