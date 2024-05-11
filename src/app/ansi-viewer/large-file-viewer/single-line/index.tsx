import React from 'react';
import { ListChildComponentProps } from 'react-window';
import { getContainer } from '../../../stores/stores-container';

import s from './index.module.css';

export function Line({ index, style }: ListChildComponentProps) {
  const { currentFileStore } = getContainer();

  const lineContent = currentFileStore.getLine(index);

  if (!lineContent) {
    return null;
  }

  return (
    <div
      key={index}
      style={style}
      className={`${s.line} ansi-line`}
      data-outer-line={index + 1}
      // TODO - line numbers should be fixed and scroll sync
      dangerouslySetInnerHTML={lineContent}
    ></div>
  );
}
