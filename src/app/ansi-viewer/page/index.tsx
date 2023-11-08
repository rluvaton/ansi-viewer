import './index.css'

interface Props {
    file: string;
}

export function AnsiViewerPage({file}: Props) {
    console.log(file);
    return (
        <div>
            <h1>Page viewer</h1>
        </div>
    )
}

