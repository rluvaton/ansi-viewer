import { observer } from 'mobx-react-lite';
import React from 'react';
import { getContainer } from '../../../stores/stores-container';

import { useDebouncedCallback } from 'use-debounce';

import s from './index.module.css';

function SearchPopUpComp() {
  const firstRenderAfterOpenRef = React.useRef(true);
  const { searchActionStore } = getContainer();
  //
  // const debouncedSearch = useDebouncedCallback(
  //     // function
  //     (value: string) => {
  //         console.log(`Searching ${value}`);
  //
  //         searchActionStore.search(value).catch((error) => {
  //             console.error('searchInFile', error);
  //         });
  //     },
  //     // delay in ms
  //     300,
  // );

  if (!searchActionStore.isOpen) {
    firstRenderAfterOpenRef.current = true;
    // TODO - add closing animation
    return null;
  }

  // TODO -

  return (
    <div className={s.searchContainer}>
      <label>
        <span>Search:</span>
        <input
          type="text"
          autoFocus
          placeholder="something"
          className={s.searchInput}
          value={searchActionStore.query}
          // TODO - add debounce on search
          onChange={(e) => searchActionStore.updateQuery(e.target.value)}
          onKeyUp={(e) => {
            if (e.key !== 'Enter') {
              return;
            }

            searchActionStore.searchNow().catch((error) => {
              console.error('searchInFile', error);
            });
          }}
        />
      </label>
    </div>
  );
}

export const SearchPopUp = observer(SearchPopUpComp);
