import React from 'react'
import {observer} from "mobx-react-lite";

import {LargeAnsiFileViewer} from "../large-file-viewer";
import {getContainer} from "../../stores/stores-container";


function AnsiViewerPageComp() {
    const {currentInstanceStore} = getContainer();
    return (
        <LargeAnsiFileViewer
            key={'large-viewer-' + currentInstanceStore.refreshKey}
        />
    )
}


export const AnsiViewerPage = observer(AnsiViewerPageComp);
