import React from 'react'
import {observer} from "mobx-react-lite";
import {useDebouncedCallback} from "use-debounce";

import {LargeAnsiFileViewer} from "../large-file-viewer";
import {getContainer} from "../../stores/stores-container";
import {useCopyANSI} from "./use-copy-ansi";

import styles from './index.module.css';

function AnsiViewerPageComp() {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const {currentInstanceStore, currentFileStore} = getContainer();
    const debouncedSearch = useDebouncedCallback(
        // function
        (value) => {
            console.log(`Searching ${value}`);

            currentFileStore.searchInFile(value).catch((error) => {
                console.error('searchInFile', error);
            });
        },
        // delay in ms
        300
    );

    useCopyANSI(containerRef);

    return (
        <div ref={containerRef}>
            {/*TODO - support new lines*/}
            {/*TODO - support go to next and prev results*/}
            <div className={styles.searchContainer}>
                <textarea
                    placeholder="Search"
                    onChange={e => debouncedSearch(e.target.value)}
                />
            </div>

            {/*TODO - highlight search locations*/}

            <LargeAnsiFileViewer
                key={'large-viewer-' + currentInstanceStore.refreshKey}
            />
        </div>
    )
}


export const AnsiViewerPage = observer(AnsiViewerPageComp);
