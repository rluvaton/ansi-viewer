import { makeAutoObservable } from "mobx";

class SearchStore {
  searchQuery = "";
  searchResults = [];
  isLoading = false;
  isSearchPopupOpen = false;

  constructor() {
    makeAutoObservable(this);
  }

  setSearchQuery(query) {
    this.searchQuery = query;
  }

  setSearchResults(results) {
    this.searchResults = results;
  }

  setIsLoading(loading) {
    this.isLoading = loading;
  }

  toggleSearchPopup() {
    this.isSearchPopupOpen = !this.isSearchPopupOpen;
  }

  // Implement a function to handle search requests and listen for search results from the backend.
  async performSearch() {
    this.setIsLoading(true);
    // Simulate a search request to the backend
    const results = await new Promise((resolve) => setTimeout(() => resolve(['Search result 1', 'Search result 2']), 1000));
    this.setSearchResults(results);
    this.setIsLoading(false);
  }
}

export default new SearchStore();
