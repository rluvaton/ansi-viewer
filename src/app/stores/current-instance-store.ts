import {action, computed, makeObservable, observable} from "mobx";

export class CurrentInstanceStore {
    public _refreshKeyNumber = 0;
    #currentWindowId: number;

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

        window.electron.onSoftRefresh(this.refresh);
        cleanupSignal.addEventListener('abort', () => {
            window.electron.offSoftRefresh(this.refresh);
        }, {once: true});

        window.addEventListener("resize", () => {
            this.windowInnerHeight = window.innerHeight;
            this.windowInnerWidth = window.innerWidth;
        }, {signal: cleanupSignal});

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
