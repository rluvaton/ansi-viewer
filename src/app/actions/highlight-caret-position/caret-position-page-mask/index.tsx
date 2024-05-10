import { observer } from 'mobx-react-lite';
import React from 'react';
import { getContainer } from '../../../stores/stores-container';

import s from './index.module.css';

function getPathCircleAroundXAndY(x: number, y: number, radius: number) {
  // Circle in path reference: https://stackoverflow.com/a/10477334/5923666
  return `
    M ${x} ${y}
    m ${radius}, 0
    a ${radius},${radius} 0 1,1 ${radius * -2},0
    a ${radius},${radius} 0 1,1  ${radius * 2},0
    `.trim();
}

function getPathDirectionForRectangle(width: number, height: number) {
  return ['M 0 0', `H ${width}`, `V ${height}`, 'H 0 0', 'Z'].join('\n');
}

function CaretPositionPageMaskComp() {
  const firstRenderAfterOpenRef = React.useRef(true);
  const { caretHighlightActionStore, currentInstanceStore } = getContainer();

  if (!caretHighlightActionStore.isOpen) {
    firstRenderAfterOpenRef.current = true;
    // TODO - add closing animation
    return null;
  }

  const { caretX, caretY } = caretHighlightActionStore;

  return (
    <svg
      className={`${s.mask} ${
        !caretHighlightActionStore.isOpen ? s.hidden : ''
      }`}
    >
      <path
        fillRule="evenodd"
        // black color with 50% opacity
        fill="rgba(0, 0, 0, 0.5)"
        d={`
               ${getPathDirectionForRectangle(
                 currentInstanceStore.windowInnerWidth,
                 currentInstanceStore.windowInnerHeight,
               )}
               ${getPathCircleAroundXAndY(caretX, caretY, 40)}
           `}
      />
    </svg>
  );
}

export const CaretPositionPageMask = observer(CaretPositionPageMaskComp);
