import React, {useState} from "react";
import {LandingPage} from "./landing-page";

function App() {
    const [filePath, setFilePath] = useState<string | null>(null)

    return (
        <>
            <LandingPage setFilePath={setFilePath}/>
        </>
    )
}

export default App
