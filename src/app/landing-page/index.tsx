import './index.css'

interface Props {
    setFilePath(filePath: string): void;
}

export function LandingPage({setFilePath}: Props) {

    return (
        <div>
            <h1>Ansi Viewer</h1>
            <p>This app will display ANSI texts</p>
            <button>Open file</button>
        </div>
    )
}

