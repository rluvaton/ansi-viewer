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
//
// // Highlighting idea came from
// // https://css-tricks.com/css-custom-highlight-api-early-look/
// // TODO - move away from this
// // @ts-ignore
// const highlight = new Highlight();
//
// // @ts-ignore
// CSS.highlights.set('my-custom-highlight', highlight);
//
// function LineCodeComp({ index, style }: ListChildComponentProps) {
//   const lineRef = React.useRef<HTMLDivElement>(null);
//   const highlightContainerRef = React.useRef<HTMLDivElement>(null);
//   const { currentFileStore } = getContainer();
//
//   const lineContent = currentFileStore.getLine(index);
//   const highlightsForLine = currentFileStore.getHighlightsForLine(index);
//
//   useEffect(() => {
//     if (!highlightsForLine.length) {
//       // highlight
//       return;
//     }
//     // this.highlightedLocation.some(location => location.line === lineNumber);
//
//     // Text node
//     const node = highlightContainerRef.current.childNodes[0];
//
//     // TODO - fix when highlight is multiple lines
//     const ranges = highlightsForLine.map((highlight) => {
//       const range = new Range();
//
//       const isMultiLine = highlight.start.line !== highlight.end.line;
//
//       if (!isMultiLine) {
//         range.setStart(node, highlight.start.column);
//         range.setEnd(node, highlight.end.column + 1);
//         return range;
//       }
//
//       if (highlight.start.line === index) {
//         range.setStart(node, highlight.start.column);
//         range.setEnd(node, node.nodeValue.length);
//       } else if (highlight.end.line === index) {
//         // TODO - fix highlight more chars than needed here
//         range.setStart(node, 0);
//         range.setEnd(node, highlight.end.column + 1);
//       }
//
//       return range;
//     });
//
//     console.log(ranges);
//
//     for (const range of ranges) {
//       highlight.add(range);
//     }
//
//     // TODO - only clear part of the highlights
//     // TODO - can do this by saving it on each highlight and when removed, delete that range
//     return () => {
//       for (const range of ranges) {
//         highlight.delete(range);
//       }
//     };
//   }, [highlightsForLine]);
//
//   useEffect(() => {
//     // TODO - move to parent, dont do in each line
//     if (currentFileStore.highlightedLocation.length === 0) {
//       highlight.clear();
//     }
//   }, [currentFileStore.highlightedLocation]);
//
//   if (!lineContent) {
//     return null;
//   }
//
//   return (
//     <div key={index} style={style}>
//       <div
//         ref={lineRef}
//         className={`${s.line} ansi-line`}
//         dangerouslySetInnerHTML={lineContent}
//       ></div>
//
//       {/* TODO - fix cant select the actual text*/}
//       <div
//         ref={highlightContainerRef}
//         className={`${s.lineHighlightContainer} noselect`}
//       >
//         {'█'.repeat(lineContent.lineLength)}
//       </div>
//     </div>
//   );
// }
//
// export const Line = observer(LineCodeComp);
