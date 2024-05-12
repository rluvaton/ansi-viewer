import { observer } from 'mobx-react-lite';
import React from 'react';

import { GoToActionSizeHelper, GoToPopUp } from '../../actions';
import { CaretPositionPageMask } from '../../actions/highlight-caret-position';
import { getContainer } from '../../stores/stores-container';
import { LargeAnsiFileViewer } from '../large-file-viewer';
import { useCopyANSI } from './use-copy-ansi';

function AnsiViewerPageComp() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { currentInstanceStore } = getContainer();

  useCopyANSI(containerRef);

  return (
    <div ref={containerRef}>
      <GoToActionSizeHelper
        key={'go-to-action-size-helper-' + currentInstanceStore.refreshKey}
      />
      <CaretPositionPageMask
        key={'caret-position-mask-' + currentInstanceStore.refreshKey}
      />

      <GoToPopUp key={'go-to-popup-' + currentInstanceStore.refreshKey} />
      <LargeAnsiFileViewer
        key={'large-viewer-' + currentInstanceStore.refreshKey}
      />
    </div>
  );
}

export const AnsiViewerPage = observer(AnsiViewerPageComp);
