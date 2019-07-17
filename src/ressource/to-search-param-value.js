import { ressourceToSearch } from "./to-search.js"

export const ressourceToSearchParamValue = (ressource, searchParamName) => {
  const search = ressourceToSearch(ressource)
  return new URLSearchParams(search).get(searchParamName)
}
