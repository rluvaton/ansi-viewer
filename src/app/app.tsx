import { ipcRenderer } from 'electron';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { FileParsedEvent } from '../shared-types';
import { AnsiViewerPage } from './ansi-viewer/page';
import { LandingPage } from './landing-page';
import { getContainer } from './stores/stores-container';

function App() {
  const { fileSelectorStore, currentFileStore, currentInstanceStore } =
    getContainer();

  useEffect(() => {
    function onFileSelected(electronEvent: unknown, event: FileParsedEvent) {
      // Ignore events that were triggered by the client to avoid duplicate parsing
      if (event.requestedFromClient) {
        return;
      }
      getContainer().fileSelectorStore.onFileSelected(event);
    }
    window.electron.onFileSelected(onFileSelected);

    window.electron.windowInitialized();

    // function logMem(_, ...args: any[]) {
    //     console.log(...args);
    // }
    //
    // window.electron.memoryUsage(logMem);
    // window.electron.register();

    return () => {
      window.electron.offFileSelected(onFileSelected);
      // window.electron.offMemoryUsage(logMem);
    };
  }, []);

  if (
    fileSelectorStore.fileSelectingState === 'idle' ||
    currentFileStore.currentFileState === 'idle'
  ) {
    return <LandingPage key={'landing-' + currentInstanceStore.refreshKey} />;
  }

  return <AnsiViewerPage key={'viewer-' + currentInstanceStore.refreshKey} />;
}

export default observer(App);
