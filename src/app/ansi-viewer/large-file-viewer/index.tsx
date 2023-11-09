import React from 'react'
import {Observer, observer} from "mobx-react-lite";
import InfiniteLoader from 'react-window-infinite-loader';
import {FixedSizeList, ListChildComponentProps} from "react-window";

import {getContainer} from "../../stores/stores-container";
import {LINES_BLOCK_SIZE} from "../../../shared/constants";

import s from './index.module.css';

function LargeAnsiFileViewerComp() {
    const {currentFileStore, currentInstanceStore} = getContainer();

    if (currentFileStore.currentFileState === 'error') {
        return <div>Error</div>
    }

    if (currentFileStore.currentFileState === 'reading') {
        return <div>Loading...</div>
    }

    const numberOfLines = currentFileStore.totalLines

    return (
        <InfiniteLoader
            // So it will re-render when the lines are loaded
            // without making lines an observable (as it is a big array)
            key={currentFileStore.linesRerenderKey}
            isItemLoaded={currentFileStore.isLineNumberLoaded}
            itemCount={numberOfLines}
            loadMoreItems={currentFileStore.loadMoreLines}
            minimumBatchSize={LINES_BLOCK_SIZE}
        >
            {({onItemsRendered, ref}) =>
                (
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
                            >
                                {LineCode}
                            </FixedSizeList>

                        )}
                    </Observer>
                )}
        </InfiniteLoader>
    )
}

function LineCode({index, style}: ListChildComponentProps) {
    const {currentFileStore} = getContainer();

    // TODO - render line, this should already be in the store parsed
    if (!currentFileStore.isLineNumberLoaded(index)) {
        return null;
    }

    const lineContent = currentFileStore.getLine(index);

    return (
        <div key={index} style={style}>{
            lineContent.items.map((item, lineItemIndex) =>
                <pre key={lineItemIndex} className={item.className}>{item.text}</pre>
            )}
        </div>
    )
}


export const LargeAnsiFileViewer = observer(LargeAnsiFileViewerComp);
