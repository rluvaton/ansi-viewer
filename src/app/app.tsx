import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { FileParsedEvent } from '../shared-types';
import { AnsiViewerPage } from './ansi-viewer/page';
import { LandingPage } from './landing-page';
import { Backend, KeyboardNavigationInFileService } from './services';
import { getContainer } from './stores/stores-container';

function App() {
  const { fileSelectorStore, currentFileStore, currentInstanceStore } =
    getContainer();

  useEffect(() => {
    function onFileSelected(_electronEvent: unknown, event: FileParsedEvent) {
      // Ignore events that were triggered by the client to avoid duplicate parsing
      if (event.requestedFromClient) {
        return;
      }

      getContainer().fileSelectorStore.onFileSelected(event);
    }

    function onGoTo() {
      getContainer().goToActionStore.openGoTo();
    }

    function onHighlightCaretPosition() {
      getContainer().caretHighlightActionStore.highlightCurrentLocation();
    }

    async function customSelectFile(
      message: CustomEvent<{
        filePath: string;
      }>,
    ) {
      await Backend.selectFile({
        filePath: message.detail.filePath,
      });
    }

    Backend.onFileSelected(onFileSelected);
    Backend.onOpenGoTo(onGoTo);
    Backend.onHighlightCaretPosition(onHighlightCaretPosition);

    Backend.windowInitialized();

    window.addEventListener('tests-custom-file-select', customSelectFile);

    return () => {
      Backend.offFileSelected(onFileSelected);
      Backend.offOpenGoTo(onGoTo);
      Backend.offHighlightCaretPosition(onHighlightCaretPosition);
      window.removeEventListener('tests-custom-file-select', customSelectFile);
    };
  }, []);

  useEffect(() => {
    KeyboardNavigationInFileService.setupKeyboardNavigationInFile();

    return () => {
      KeyboardNavigationInFileService.cleanupKeyboardNavigationInFile();
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
