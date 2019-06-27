// https://github.com/jshttp/mime-db/blob/master/src/apache-types.json

import { ressourceToExtension } from "./to-extension.js"

const contentTypeDefault = "application/octet-stream"

export const ressourceToContentType = (ressource, contentTypeMap) => {
  if (typeof contentTypeMap !== "object") {
    throw new TypeError(`contentTypeMap must be an object, got ${contentTypeMap}`)
  }

  const extension = ressourceToExtension(ressource)

  const availableContentTypes = Object.keys(contentTypeMap)
  const contentTypeForExtension = availableContentTypes.find((contentTypeName) => {
    const contentType = contentTypeMap[contentTypeName]
    return contentType.extensions && contentType.extensions.indexOf(extension) > -1
  })

  return contentTypeForExtension || contentTypeDefault
}
