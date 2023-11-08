import React from 'react';
import {observer} from "mobx-react-lite";
import {getContainer} from "../stores/stores-container";

function LandingPageComp() {
    const {fileSelectorStore} = getContainer();

    return (
        <div>
            <h1>Ansi Viewer</h1>
            <p>This app will display ANSI texts</p>

            {/* TODO - allow to disable while selecting*/}
            <button disabled={fileSelectorStore.fileSelectingState === 'selecting'} onClick={fileSelectorStore.selectFile}>Open file</button>
        </div>
    )
}

export const LandingPage = observer(LandingPageComp);
