import React from 'react'
import {observer} from "mobx-react-lite";
import {getContainer} from "../../stores/stores-container";

import InfiniteLoader from 'react-window-infinite-loader';

import {FixedSizeList, ListChildComponentProps} from "react-window";

import s from './index.module.css';

function LargeAnsiFileViewerComp() {
    const {currentFileStore} = getContainer();

    if(currentFileStore.currentFileState === 'error') {
        return <div>Error</div>
    }

    if(currentFileStore.currentFileState === 'reading') {
        return <div>Loading...</div>
    }

    const numberOfLines = currentFileStore.lines.length

    return (
        // <InfiniteLoader
        //     // So it will re-render when the lines are loaded
        //     // without making lines an observable (as it is a big array)
        //     key={currentFileStore.linesRerenderKey}
        //     isItemLoaded={currentFileStore.isLineNumberLoaded}
        //     itemCount={numberOfLines}
        //     loadMoreItems={currentFileStore.loadMoreLines}
        // >
        //     {({onItemsRendered, ref,}) => (

                // TODO - should not be fixed
                <FixedSizeList
                    key={currentFileStore.linesRerenderKey}
                    // Should this be the current displayed lines?
                    itemCount={numberOfLines}
                    // onItemsRendered={onItemsRendered}
                    // ref={ref}

                    // TODO - make sure it's cached
                    height={window.innerHeight}
                    width="100%"

                    // this is the line height
                    // TODO - change to the actual line height by calculating it
                    itemSize={22}
                    className={s.ansiContainer}
                >
                    {LineCode}
                </FixedSizeList>
        //     )}
        // </InfiniteLoader>
    )
}

function LineCode({index, style}: ListChildComponentProps) {
    const {currentFileStore} = getContainer();

    // TODO - render line, this should already be in the store parsed
    if (!currentFileStore.isLineNumberLoaded(index)) {
        return <span>'Loading..'</span>;
    }

    const lineContent = currentFileStore.getLine(index);

    return <div key={index} style={style}>{lineContent.map((item, lineItemIndex) => <pre key={lineItemIndex} className={item.className}>{item.text}</pre>)}</div>
}


export const LargeAnsiFileViewer = observer(LargeAnsiFileViewerComp);
