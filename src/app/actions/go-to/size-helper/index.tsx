import { observer } from "mobx-react-lite";
import React, { CSSProperties, useEffect, useRef } from "react";

import { LINE_HEIGHT } from "../../../stores/go-to-action-store";
import { getContainer } from "../../../stores/stores-container";

import ansiViewerStyle from "../../../ansi-viewer/large-file-viewer/index.module.css";

const AnsiContainerConstantStyle = {
	position: "absolute",
	visibility: "hidden",
} satisfies CSSProperties;

const AnsiLineConstantStyle = {
	height: LINE_HEIGHT + "px",
	width: "auto",
} satisfies CSSProperties;

function GoToActionSizeHelperComp() {
	const lineNumberRef = useRef<HTMLElement>(null);
	const contentRef = useRef<HTMLPreElement>(null);

	useEffect(() => {
		function saveTextMetadata() {
			if (!lineNumberRef.current || !contentRef.current) {
				return;
			}

			getContainer().goToActionStore.saveTextSizeMetadata({
				charSizeInPx: contentRef.current!.getBoundingClientRect().width,
				prefixSizeInPx: lineNumberRef.current!.getBoundingClientRect().width,
			});
		}

		const interval = setInterval(saveTextMetadata, 10_000);

		return () => {
			clearInterval(interval);
		};
	}, []);

	return (
		<div
			className={ansiViewerStyle.ansiContainer}
			style={AnsiContainerConstantStyle}
		>
			{/*This should look the same as LineCode component */}
			<div
				className={`${ansiViewerStyle.line} ansi-line`}
				style={AnsiLineConstantStyle}
			>
				<code ref={lineNumberRef} className="line-number noselect">
					7
				</code>
				<pre ref={contentRef}>a</pre>
			</div>
		</div>
	);
}

export const GoToActionSizeHelper = observer(GoToActionSizeHelperComp);
