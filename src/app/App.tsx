import React, {useState} from "react";
import {LandingPage} from "./landing-page";
import {AnsiViewerPage} from "./ansi-viewer/page";
import {getContainer} from "./stores/stores-container";
import {observer} from "mobx-react-lite";

function App() {
    const {fileSelectorStore} = getContainer();

    return (
        <>
            {fileSelectorStore.fileSelectingState === 'idle' &&
                <LandingPage/>}
            {/*TODO - avoid rerendering when selecting file*/}
            {fileSelectorStore.fileSelectingState !== 'idle' && <AnsiViewerPage/>}
        </>
    )
}

export default observer(App)
