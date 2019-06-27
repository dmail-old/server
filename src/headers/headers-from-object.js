/*
https://developer.mozilla.org/en-US/docs/Web/API/Headers
https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
*/

import { normalizeName, normalizeValue } from "./normalize.js"

export const headersFromObject = (headersObject) => {
  const headers = {}

  Object.keys(headersObject).forEach((headerName) => {
    headers[normalizeName(headerName)] = normalizeValue(headersObject[headerName])
  })

  return headers
}
