import { register, unregister } from '@tauri-apps/api/globalShortcut';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { FileParsedEvent, MappingFileCreatedEvent } from '../shared-types';
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
      if (event.requested_from_client) {
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
      await getContainer().fileSelectorStore.selectFile(
        message.detail.filePath,
      );
    }

    function onMappingFileCreated(event: MappingFileCreatedEvent) {
      getContainer().fileSelectorStore.onMappingFileCreated(event);
    }

    Backend.onFileSelected(onFileSelected);
    Backend.onOpenGoTo(onGoTo);
    Backend.onHighlightCaretPosition(onHighlightCaretPosition);
    Backend.onMappingFileCreated(onMappingFileCreated);

    Backend.windowInitialized();

    window.addEventListener('tests-custom-file-select', customSelectFile);

    async function registerHotKeys() {
      await Promise.all([
        // Open file
        unregister('CmdOrControl+O'),

        // Refresh
        unregister('CmdOrControl+R'),
      ]);

      await Promise.all([
        // Open file
        register('CommandOrControl+O', () => {
          console.log('Selecting file from hotkey');
          getContainer().fileSelectorStore.selectFile();
        }),
        // Refresh
        register('CommandOrControl+R', () => {
          console.log('Reloading from hotkey');
          getContainer().currentInstanceStore.refresh();
        }),
      ]);
    }

    registerHotKeys();

    return () => {
      Backend.offFileSelected(onFileSelected);
      Backend.offMappingFileCreated(onMappingFileCreated);
      Backend.offOpenGoTo(onGoTo);
      Backend.offHighlightCaretPosition(onHighlightCaretPosition);
      window.removeEventListener('tests-custom-file-select', customSelectFile);
      unregister('CmdOrControl+O');
      unregister('CmdOrControl+R');
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
