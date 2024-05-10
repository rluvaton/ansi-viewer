import React from 'react'
import {observer} from "mobx-react-lite";

import {LargeAnsiFileViewer} from "../large-file-viewer";
import {getContainer} from "../../stores/stores-container";
import {useCopyANSI} from "./use-copy-ansi";
import {GoToActionSizeHelper, GoToPopUp} from "../../actions";
import {CaretPositionPageMask} from "../../actions/highlight-caret-position";
import { SearchInput } from '../../actions/search';

function AnsiViewerPageComp() {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const {currentInstanceStore, searchStore} = getContainer();

    useCopyANSI(containerRef);

    // Implement a function to handle search requests and listen for search results from the backend.
    const handleSearch = (query) => {
        searchStore.setSearchQuery(query);
        searchStore.performSearch();
    };

    return (
        <div ref={containerRef}>
            <GoToActionSizeHelper
                key={'go-to-action-size-helper-' + currentInstanceStore.refreshKey}/>
            <CaretPositionPageMask key={'caret-position-mask-' + currentInstanceStore.refreshKey}/>
            <GoToPopUp key={'go-to-popup-' + currentInstanceStore.refreshKey}/>
            <SearchInput onSearch={handleSearch} /> {/* */}
            <LargeAnsiFileViewer
                key={'large-viewer-' + currentInstanceStore.refreshKey}
            />
        </div>
    )
}


export const AnsiViewerPage = observer(AnsiViewerPageComp);
