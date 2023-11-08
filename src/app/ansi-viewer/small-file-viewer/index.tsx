import React, {useEffect} from 'react'
import {observer} from "mobx-react-lite";
import {getContainer} from "../../stores/stores-container";

import s from './index.module.css';

function SmallAnsiFileViewerComp() {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const {currentFileStore} = getContainer();

    useEffect(() => {
        currentFileStore.setViewerContainer(containerRef.current);

        return () => {
            getContainer().currentFileStore.clearViewerContainer();
        }
    }, []);

    return (
        <>

            <div ref={containerRef} className={s.ansiContainer}>
            </div>
        </>
    )
}



export const SmallAnsiFileViewer = observer(SmallAnsiFileViewerComp);
