import React, {useState} from "react";
import {LandingPage} from "./landing-page";
import {AnsiViewerPage} from "./ansi-viewer/page";

function App() {
    const [filePath, setFilePath] = useState<string | null>(null)

    return (
        <>
            {!filePath && <LandingPage setFilePath={setFilePath}/>}
            {filePath && <AnsiViewerPage filePath={filePath}/>}
        </>
    )
}

export default App
