import React, {useEffect} from "react";
import {LandingPage} from "./landing-page";
import {AnsiViewerPage} from "./ansi-viewer/page";
import {getContainer} from "./stores/stores-container";
import {observer} from "mobx-react-lite";
import {FileParsedEvent} from "../shared-types";
import { KeyboardNavigationInFileService } from "./services";

function App() {
    const {fileSelectorStore, currentFileStore, currentInstanceStore} = getContainer();

    useEffect(() => {
        function onFileSelected(electronEvent: unknown, event: FileParsedEvent) {
            // Ignore events that were triggered by the client to avoid duplicate parsing
            if (event.requestedFromClient) {
                return;
            }
            getContainer().fileSelectorStore.onFileSelected(event);
        }

        function onGoTo(_electronEvent: unknown) {
            getContainer().goToActionStore.openGoTo();
        }

        window.electron.onFileSelected(onFileSelected);
        window.electron.onOpenGoTo(onGoTo);

        window.electron.windowInitialized();

        return () => {
            window.electron.offFileSelected(onFileSelected);
            window.electron.offOpenGoTo(onGoTo);
        };
    }, []);


    useEffect(() => {
        KeyboardNavigationInFileService.setupKeyboardNavigationInFile();

        return () => {
            KeyboardNavigationInFileService.cleanupKeyboardNavigationInFile();
        }
    }, []);

    if (fileSelectorStore.fileSelectingState === 'idle' || currentFileStore.currentFileState === 'idle') {
        return <LandingPage key={'landing-' + currentInstanceStore.refreshKey}/>
    }

    return <AnsiViewerPage key={'viewer-' + currentInstanceStore.refreshKey}/>
}

export default observer(App)
