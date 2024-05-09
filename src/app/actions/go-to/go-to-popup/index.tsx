import React from 'react'
import {observer} from "mobx-react-lite";
import {getContainer} from "../../../stores/stores-container";

import s from './index.module.css';

function GoToPopUpComp() {
    const firstRenderAfterOpenRef = React.useRef(true);
    const goToActionStore = getContainer().goToActionStore;

    if (!goToActionStore.isOpen) {
        firstRenderAfterOpenRef.current = true;
        // TODO - add closing animation
        return null;
    }

    // TODO -

    return (
        <div className={s.goToContainer}>
            <label>
                <span>Go to line:</span>
                <input type="text"
                       autoFocus
                       title="[Line] [:Column]"
                       pattern="[0-9]+\s*(:\s*[0-9]+\s*)?"
                       className={s.goToInput}
                       value={goToActionStore.locationInput}
                       onChange={e => goToActionStore.updateLocationInput(e.target.value)}
                       onKeyUp={e => {
                           if (e.key !== 'Enter') {
                               return;
                           }

                           goToActionStore.goToFromInput();
                       }}

                       onFocus={(e) => {
                           if(firstRenderAfterOpenRef.current) {
                               // Auto select on first init
                               e.target.setSelectionRange(0, goToActionStore.locationInput.length + 1)
                               firstRenderAfterOpenRef.current = false;
                           }
                       }}
                />
            </label>
        </div>
    );
}

export const GoToPopUp = observer(GoToPopUpComp);
