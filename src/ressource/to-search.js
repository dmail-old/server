export const ressourceToSearch = (ressource) => {
  const searchSeparatorIndex = ressource.indexOf("?")
  return searchSeparatorIndex === -1 ? "?" : ressource.slice(searchSeparatorIndex)
}
