import React from 'react'
import {observer} from "mobx-react-lite";

import {SmallAnsiFileViewer} from "../small-file-viewer";


function AnsiViewerPageComp() {
    return (
        <SmallAnsiFileViewer />
    )
}



export const AnsiViewerPage = observer(AnsiViewerPageComp);
