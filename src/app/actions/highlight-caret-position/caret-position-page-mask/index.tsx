import React from 'react'
import {observer} from "mobx-react-lite";
import {getContainer} from "../../../stores/stores-container";

import s from './index.module.css';

function getPathCircleAroundXAndY(x: number, y: number, radius: number) {
    // Circle in path reference: https://stackoverflow.com/a/10477334/5923666

    return `
    M ${x} ${y}
    m ${radius}, 0
    a ${radius},${radius} 0 1,1 ${radius * -2},0
    a ${radius},${radius} 0 1,1  ${radius * 2},0
    `.trim()
}

function CaretPositionPageMaskComp() {
    const firstRenderAfterOpenRef = React.useRef(true);
    const {caretHighlightActionStore, currentInstanceStore} = getContainer();

    if (!caretHighlightActionStore.isOpen) {
        firstRenderAfterOpenRef.current = true;
        // TODO - add closing animation
        return null;
    }

    const {caretX, caretY} = caretHighlightActionStore;


    // TODO -
    return (<svg className={`${s.mask} ${!caretHighlightActionStore.isOpen ? s.hidden : ''}`}>

        <path
            fill-rule="evenodd"

            // black color with 50% opacity
            fill="rgba(0, 0, 0, 0.5)"
            d={`
               M 0 0
               H ${currentInstanceStore.windowInnerWidth}
               V ${currentInstanceStore.windowInnerHeight}
               H 0 0
               Z
           
               ${getPathCircleAroundXAndY(caretX, caretY, 40)}
           `}/>

    </svg>)
}

export const CaretPositionPageMask = observer(CaretPositionPageMaskComp);
