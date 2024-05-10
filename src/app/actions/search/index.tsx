import React, { useState } from 'react';
import { debounce } from 'lodash';
import styles from './index.module.css';

const SearchInput = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = debounce((query) => {
    onSearch(query);
  }, 300);

  const handleChange = (event) => {
    const newQuery = event.target.value;
    setQuery(newQuery);
    handleSearch(newQuery);
  };

  return (
    <div className={styles.searchContainer}>
      <input
        type="text"
        className={styles.searchInput}
        value={query}
        onChange={handleChange}
        placeholder="Search..."
      />
      <button
        className={styles.searchButton}
        onClick={() => handleSearch(query)}
      >
        Search
      </button>
    </div>
  );
};

export default SearchInput;
