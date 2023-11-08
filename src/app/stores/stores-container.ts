import {FileSelectorStore} from "./file-selector-store";
import {CurrentFileStore} from "./current-file-store";

class StoreContainer {
    private static _instance?: StoreContainer;

    private _fileSelectorStore: FileSelectorStore;
    private _currentFileStore: CurrentFileStore;

    public get fileSelectorStore(): FileSelectorStore {
        return this._fileSelectorStore;
    }

    public get currentFileStore(): CurrentFileStore {
        return this._currentFileStore;
    }

    public static get instance(): StoreContainer {
        if (!StoreContainer._instance) {
            StoreContainer._instance = new StoreContainer();
            StoreContainer._instance.init();
        }

        return StoreContainer._instance;
    }

    private init() {
        this._fileSelectorStore = new FileSelectorStore();
        this._currentFileStore = new CurrentFileStore();
    }

    static reset() {
        StoreContainer._instance = undefined
    }
}

export function getContainer(): StoreContainer {
    return StoreContainer.instance;
}

export function resetContainer(): void {
    StoreContainer.reset();
}
