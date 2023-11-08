import React from 'react';

interface Props {
    setFilePath(filePath: string): void;
}

export function LandingPage({setFilePath}: Props) {
    const [isInMiddleOfSelectingFile, setIsInMiddleOfSelectingFile] = React.useState(false);

    return (
        <div>
            <h1>Ansi Viewer</h1>
            <p>This app will display ANSI texts</p>
            <button disabled={isInMiddleOfSelectingFile} onClick={async () => {
                try {
                    const filePathToRead = await window.electron.selectFile();
                    console.log(filePathToRead);

                    if(!filePathToRead) {
                        // no file selected
                        return;
                    }

                    setFilePath(filePathToRead);
                } finally {
                    setIsInMiddleOfSelectingFile(false);
                }
            }}>Open file</button>
        </div>
    )
}
