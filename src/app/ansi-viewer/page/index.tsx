import React from 'react'
import {observer} from "mobx-react-lite";

import {LargeAnsiFileViewer} from "../large-file-viewer";
import {getContainer} from "../../stores/stores-container";
import {useCopyANSI} from "./use-copy-ansi";

function AnsiViewerPageComp() {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const {currentInstanceStore} = getContainer();

    useCopyANSI(containerRef);

    return (
        <div ref={containerRef}>
            <LargeAnsiFileViewer
                key={'large-viewer-' + currentInstanceStore.refreshKey}
            />
        </div>
    )
}


export const AnsiViewerPage = observer(AnsiViewerPageComp);
