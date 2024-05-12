import { observer } from 'mobx-react-lite';
import React from 'react';

import { GoToActionSizeHelper, GoToPopUp, SearchPopUp } from '../../actions';
import { CaretPositionPageMask } from '../../actions/highlight-caret-position';
import { getContainer } from '../../stores/stores-container';
import { LargeAnsiFileViewer } from '../large-file-viewer';

function AnsiViewerPageComp() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { currentInstanceStore } = getContainer();

  return (
    <div ref={containerRef}>
      <GoToActionSizeHelper
        key={'go-to-action-size-helper-' + currentInstanceStore.refreshKey}
      />
      <CaretPositionPageMask
        key={'caret-position-mask-' + currentInstanceStore.refreshKey}
      />

      <GoToPopUp key={'go-to-popup-' + currentInstanceStore.refreshKey} />
      <SearchPopUp key={'search-popup-' + currentInstanceStore.refreshKey} />

      {/*TODO - highlight search locations*/}
      <LargeAnsiFileViewer
        key={'large-viewer-' + currentInstanceStore.refreshKey}
      />
    </div>
  );
}

export const AnsiViewerPage = observer(AnsiViewerPageComp);
