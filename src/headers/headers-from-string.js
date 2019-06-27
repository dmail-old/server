import { normalizeName, normalizeValue } from "./normalize.js"

// https://gist.github.com/mmazer/5404301
export const headersFromString = (headerString) => {
  const headers = {}

  if (headerString) {
    const pairs = headerString.split("\r\n")
    pairs.forEach((pair) => {
      const index = pair.indexOf(": ")
      if (index > 0) {
        const key = pair.slice(0, index)
        const value = pair.slice(index + 2)
        headers[normalizeName(key)] = normalizeValue(value)
      }
    })
  }

  return headers
}
