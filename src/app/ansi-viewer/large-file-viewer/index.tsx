import { Observer, observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

import { LINES_BLOCK_SIZE } from '../../../shared/constants';
import { getContainer } from '../../stores/stores-container';

import s from './index.module.css';

// Highlighting idea came from
// https://css-tricks.com/css-custom-highlight-api-early-look/
// TODO - move away from this
// @ts-ignore
const highlight = new Highlight();

// @ts-ignore
CSS.highlights.set('my-custom-highlight', highlight);

function LargeAnsiFileViewerComp() {
  const { currentFileStore, currentInstanceStore } = getContainer();

  if (currentFileStore.currentFileState === 'error') {
    return <div>Error</div>;
  }

  if (currentFileStore.currentFileState === 'reading') {
    return <div>Loading...</div>;
  }

  useEffect(() => {
    if (currentFileStore.highlightedLocation.length === 0) {
      highlight.clear();
    }
  }, [currentFileStore.highlightedLocation]);

  const numberOfLines = currentFileStore.totalLines;

  return (
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
              ref={ref}
              height={currentInstanceStore.windowInnerHeight}
              width="100%"
              // this is the line height
              // TODO - change to the actual line height by calculating it
              itemSize={22}
              overscanCount={LINES_BLOCK_SIZE * 3}
            >
              {LineCode}
            </FixedSizeList>
          )}
        </Observer>
      )}
    </InfiniteLoader>
  );
}

function LineCodeComp({ index, style }: ListChildComponentProps) {
  const lineRef = React.useRef<HTMLDivElement>(null);
  const highlightContainerRef = React.useRef<HTMLDivElement>(null);
  const { currentFileStore } = getContainer();

  const lineContent = currentFileStore.getLine(index);
  const highlightsForLine = currentFileStore.getHighlightsForLine(index);

  useEffect(() => {
    if (!highlightsForLine.length) {
      // highlight
      return;
    }
    // this.highlightedLocation.some(location => location.line === lineNumber);

    // Text node
    const node = highlightContainerRef.current.childNodes[0];

    // TODO - fix when highlight is multiple lines
    const ranges = highlightsForLine.map((highlight) => {
      const range = new Range();

      const isMultiLine = highlight.start.line !== highlight.end.line;

      if (!isMultiLine) {
        range.setStart(node, highlight.start.column);
        range.setEnd(node, highlight.end.column + 1);
        return range;
      }

      if (highlight.start.line === index) {
        range.setStart(node, highlight.start.column);
        range.setEnd(node, node.nodeValue.length);
      } else if (highlight.end.line === index) {
        // TODO - fix highlight more chars than needed here
        range.setStart(node, 0);
        range.setEnd(node, highlight.end.column + 1);
      }

      return range;
    });

    console.log(ranges);

    for (const range of ranges) {
      highlight.add(range);
    }

    // TODO - only clear part of the highlights
    // TODO - can do this by saving it on each highlight and when removed, delete that range
    return () => {
      for (const range of ranges) {
        highlight.delete(range);
      }
    };
  }, [highlightsForLine]);

  if (!lineContent) {
    return null;
  }

  return (
    <div key={index} style={style}>
      <div
        ref={lineRef}
        className={`${s.line} ansi-line`}
        dangerouslySetInnerHTML={lineContent}
      ></div>

      {/* TODO - fix cant select the actual text*/}
      <div
        ref={highlightContainerRef}
        className={`${s.lineHighlightContainer} noselect`}
      >
        {'█'.repeat(lineContent.lineLength)}
      </div>
    </div>
  );
}

const LineCode = observer(LineCodeComp);

export const LargeAnsiFileViewer = observer(LargeAnsiFileViewerComp);
