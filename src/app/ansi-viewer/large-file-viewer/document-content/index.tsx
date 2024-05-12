import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef } from 'react';
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

import { LINES_BLOCK_SIZE } from '../../../../shared/constants';
import { LINE_HEIGHT } from '../../../stores/go-to-action-store';
import { getContainer } from '../../../stores/stores-container';
import { Line } from '../single-line';

type InfiniteLoaderProps = React.ComponentProps<typeof InfiniteLoader>;
type InfiniteLoaderChildrenProps = React.ComponentProps<
  InfiniteLoaderProps['children']
>;

export function DocumentContentComp({
  onItemsRendered,
  // Until React fix this issue that can't pass ref as a prop
  listRef,
}: Omit<InfiniteLoaderChildrenProps, 'ref'> & { listRef: (ref: any) => void }) {
  const outerRef = useRef<HTMLDivElement>(null);

  const { currentFileStore, currentInstanceStore, goToActionStore } =
    getContainer();

  const numberOfLines = currentFileStore.totalLines;

  useEffect(() => {
    goToActionStore.registerList(outerRef);

    return () => {
      goToActionStore.unregisterList();
    };
  }, [goToActionStore]);

  return (
    // TODO - should not be fixed
    <FixedSizeList
      key={currentFileStore.linesRerenderKey}
      itemCount={numberOfLines}
      onItemsRendered={onItemsRendered}
      outerRef={outerRef}
      ref={listRef}
      height={currentInstanceStore.windowInnerHeight}
      width="100%"
      // this is the line height
      itemSize={LINE_HEIGHT}
      overscanCount={LINES_BLOCK_SIZE * 3}
    >
      {Line}
    </FixedSizeList>
  );
}

export const DocumentContent = observer(DocumentContentComp);
