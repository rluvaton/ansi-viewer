import React, {useEffect} from "react";

export function useCopyANSI(ref: React.RefObject<HTMLElement>) {

    useEffect(() => {
        const container = ref.current;

        if(!container) {
            return;
        }

        function copyListener(event: ClipboardEvent) {
            const range = window.getSelection().getRangeAt(0);
            const rangeContents = range.cloneContents();
            const helper = document.createElement("div");

            helper.appendChild(rangeContents);

            const nodes = Array.from(helper.children) as HTMLElement[];
            if(nodes.every(node => !node.classList.contains("ansi-line"))) {
                // Default copy behavior if there are no ansi lines
                return;
            }

            let text = '';
            for (let i = 0; i < nodes.length; i++){
                const node = nodes[i];
                if (!node.classList.contains("ansi-line")) {
                    text += node.innerText;
                    continue;
                }

                // Remove the first child which is the line number

                if ((node.firstChild as HTMLElement | undefined)?.classList.contains("noselect")) {
                    node.removeChild(node.firstChild);
                }
                text += node.innerText;

                // Add a new line if not the last line
                if (i < nodes.length - 1) {
                    text += '\n';
                }
            }

            event.clipboardData.setData("text/plain", text);
            event.preventDefault();
        }

        container.addEventListener("copy", copyListener);

        return () => container.removeEventListener("copy", copyListener)
    }, []);

}
