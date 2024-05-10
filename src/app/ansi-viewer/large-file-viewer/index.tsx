import { Observer, observer } from 'mobx-react-lite';
import React, { useEffect, useRef } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

import { LINES_BLOCK_SIZE } from '../../../shared/constants';
import { LINE_HEIGHT } from '../../stores/go-to-action-store';
import { getContainer } from '../../stores/stores-container';

import s from './index.module.css';

function LargeAnsiFileViewerComp() {
  const contentRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);

  const { currentFileStore, currentInstanceStore, goToActionStore } =
    getContainer();

  if (currentFileStore.currentFileState === 'error') {
    return <div>Error</div>;
  }

  if (currentFileStore.currentFileState === 'reading') {
    return <div>Loading...</div>;
  }

  const numberOfLines = currentFileStore.totalLines;

  useEffect(() => {
    goToActionStore.registerList(outerRef);

    return () => {
      goToActionStore.unregisterList();
    };
  }, [goToActionStore]);

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
        {({ onItemsRendered, ref }) => (
          <Observer>
            {() => (
              // TODO - should not be fixed
              <FixedSizeList
                key={currentFileStore.linesRerenderKey}
                className={s.ansiContainer}
                itemCount={numberOfLines}
                onItemsRendered={onItemsRendered}
                outerRef={outerRef}
                ref={ref}
                height={currentInstanceStore.windowInnerHeight}
                width="100%"
                // this is the line height
                itemSize={LINE_HEIGHT}
                overscanCount={LINES_BLOCK_SIZE * 3}
              >
                {LineCode}
              </FixedSizeList>
            )}
          </Observer>
        )}
      </InfiniteLoader>
    </div>
  );
}

function LineCode({ index, style }: ListChildComponentProps) {
  const { currentFileStore } = getContainer();

  const lineContent = currentFileStore.getLine(index);

  if (!lineContent) {
    return null;
  }

  return (
    //
    <div
      key={index}
      style={style}
      className={`${s.line} ansi-line`}
      data-outer-line={index + 1}
      // TODO - line numbers should be fixed
      dangerouslySetInnerHTML={lineContent}
    ></div>
  );
}

export const LargeAnsiFileViewer = observer(LargeAnsiFileViewerComp);
