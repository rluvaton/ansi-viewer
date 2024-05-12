import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef } from 'react';
import InfiniteLoader from 'react-window-infinite-loader';

import { LINES_BLOCK_SIZE } from '../../../shared/constants';
import { getContainer } from '../../stores/stores-container';

import { setCaretPosition } from '../../services/keyboard-navigation-in-file';
import { DocumentContent } from './document-content';

function LargeAnsiFileViewerComp() {
  const contentRef = useRef<HTMLDivElement>(null);

  const { currentFileStore } = getContainer();

  if (currentFileStore.currentFileState === 'error') {
    return <div>Error</div>;
  }

  if (currentFileStore.currentFileState === 'reading') {
    return <div>Loading...</div>;
  }

  const numberOfLines = currentFileStore.totalLines;

  useEffect(() => {
    if (getContainer().currentFileStore.totalLines === 0) {
      return;
    }

    // Set caret to the start of the file so can copy
    // and not using focus as it will put it on the line number and not the text
    setCaretPosition(contentRef.current, 1, 0);
  }, []);

  return (
    <div
      ref={contentRef}
      contentEditable={true}
      spellCheck={false}
      data-disable-content-edit={true}
      className="strip-content-editable-style"
      onKeyDown={(e) => {
        if (e.key === 'i') {
          e.preventDefault();
          getContainer().caretHighlightActionStore.highlightCurrentLocation();
        }
      }}
    >
      <InfiniteLoader
        // So it will re-render when the lines are loaded
        // without making lines an observable (as it is a big array)
        key={currentFileStore.linesRerenderKey}
        isItemLoaded={currentFileStore.isLineNumberLoaded}
        itemCount={numberOfLines}
        loadMoreItems={currentFileStore.loadMoreLines}
        minimumBatchSize={LINES_BLOCK_SIZE}
        // fetch 5 more blocks so it will be smoother
        threshold={LINES_BLOCK_SIZE * 5}
      >
        {(props) => (
          <DocumentContent
            listRef={props.ref}
            onItemsRendered={props.onItemsRendered}
          />
        )}
      </InfiniteLoader>
    </div>
  );
}

export const LargeAnsiFileViewer = observer(LargeAnsiFileViewerComp);
