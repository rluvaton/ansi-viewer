import React, {useEffect} from "react";
import {LandingPage} from "./landing-page";
import {AnsiViewerPage} from "./ansi-viewer/page";
import {getContainer} from "./stores/stores-container";
import {observer} from "mobx-react-lite";
import {FileParsedEvent} from "../shared-types";

function App() {
    const {fileSelectorStore, currentFileStore, currentInstanceStore} = getContainer();

    useEffect(() => {
        function onFileSelected(electronEvent: unknown, event: FileParsedEvent) {
            getContainer().fileSelectorStore.onFileSelected(event);
        }
        window.electron.onFileSelected(onFileSelected);

        return () => window.electron.offFileSelected(onFileSelected);
    }, []);

    if (fileSelectorStore.fileSelectingState === 'idle' || currentFileStore.currentFileState === 'idle') {
        return <LandingPage key={'landing-' + currentInstanceStore.refreshKey}/>
    }

    return <AnsiViewerPage key={'viewer-' + currentInstanceStore.refreshKey}/>
}

export default observer(App)
