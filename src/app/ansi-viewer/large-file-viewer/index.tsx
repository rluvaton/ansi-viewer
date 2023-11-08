import React from 'react'
import {observer} from "mobx-react-lite";
import {getContainer} from "../../stores/stores-container";

import InfiniteLoader from 'react-window-infinite-loader';

import {FixedSizeList} from "react-window";

import s from './index.module.css';

function LargeAnsiFileViewerComp() {
    const {currentFileStore} = getContainer();

    if(currentFileStore.currentFileState === 'error') {
        return <div>Error</div>
    }

    if(currentFileStore.currentFileState === 'reading') {
        return <div>Loading...</div>
    }
    const numberOfLines = 100; // currentFileStore.lines.length

    return (
        <InfiniteLoader
            isItemLoaded={currentFileStore.isLineNumberLoaded}
            itemCount={numberOfLines}
            loadMoreItems={currentFileStore.loadMoreLines}
        >
            {({onItemsRendered, ref,}) => (

                // TODO - should not be fixed
                <FixedSizeList
                    // Should this be the current displayed lines?
                    itemCount={numberOfLines}
                    onItemsRendered={onItemsRendered}
                    ref={ref}

                    // TODO - change this to be the screen height and width
                    height={500}
                    width={500}

                    // this is the line height
                    // TODO - change to the actual line height by calculating it
                    itemSize={22}
                    className={s.ansiContainer}
                >
                    {({index, style}) => {
                        // TODO - render line, this should already be in the store parsed
                        if (!currentFileStore.isLineNumberLoaded(index)) {
                            return <span>'Loading..'</span>;
                        }

                        const lineContent = currentFileStore.getLine(index);

                        return <>{lineContent.map(item => <pre key={item.text} style={style} className={item.className}>{item.text}</pre>)}</>
                    }}
                </FixedSizeList>
            )}
        </InfiniteLoader>
    )
}


export const LargeAnsiFileViewer = observer(LargeAnsiFileViewerComp);
