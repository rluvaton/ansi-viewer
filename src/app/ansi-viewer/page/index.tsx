import React from 'react'
import {observer} from "mobx-react-lite";

import {LargeAnsiFileViewer} from "../large-file-viewer";
import {getContainer} from "../../stores/stores-container";
import {useCopyANSI} from "./use-copy-ansi";
import {GoToActionSizeHelper, GoToPopUp} from "../../actions";

function AnsiViewerPageComp() {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const {currentInstanceStore} = getContainer();

    useCopyANSI(containerRef);

    return (
        <div ref={containerRef}>
            <GoToActionSizeHelper
                key={'go-to-action-size-helper-' + currentInstanceStore.refreshKey}/>
            <GoToPopUp  key={'go-to-popup-' + currentInstanceStore.refreshKey}/>
            <LargeAnsiFileViewer
                key={'large-viewer-' + currentInstanceStore.refreshKey}
            />
        </div>
    )
}


export const AnsiViewerPage = observer(AnsiViewerPageComp);
