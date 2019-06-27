import { nodeStreamToObservable } from "../observable/index.js"
import { headersFromObject } from "../headers/index.js"

export const nodeRequestToRequest = (nodeRequest, origin) => {
  const ressource = nodeRequest.url
  const { method } = nodeRequest
  const headers = headersFromObject(nodeRequest.headers)
  const body =
    method === "POST" || method === "PUT" || method === "PATCH"
      ? nodeStreamToObservable(nodeRequest)
      : undefined

  return Object.freeze({
    origin,
    ressource,
    method,
    headers,
    body,
  })
}
