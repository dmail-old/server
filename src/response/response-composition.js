import {
  arrayWithoutDuplicate,
  compositionMappingToComposeStrict,
  compositionMappingToCompose,
} from "@dmail/helper"

const composeHeaderValues = (value, nextValue) => {
  return arrayWithoutDuplicate([...value.split(", "), ...nextValue.split(", ")]).join(", ")
}

const headerCompositionMapping = {
  accept: composeHeaderValues,
  "accept-charset": composeHeaderValues,
  "accept-language": composeHeaderValues,
  "access-control-allow-headers": composeHeaderValues,
  "access-control-allow-methods": composeHeaderValues,
  "access-control-allow-origin": composeHeaderValues,
  // 'content-type', // https://github.com/ninenines/cowboy/issues/1230
  vary: composeHeaderValues,
}

export const composeResponseHeaders = compositionMappingToCompose(headerCompositionMapping)

const responseCompositionMapping = {
  status: (prevStatus, status) => status,
  statusText: (prevStatusText, statusText) => statusText,
  headers: composeResponseHeaders,
  body: (prevBody, body) => body,
  bodyEncoding: (prevEncoding, encoding) => encoding,
}

export const composeResponse = compositionMappingToComposeStrict(responseCompositionMapping)
