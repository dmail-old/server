// https://www.w3.org/TR/cors/
// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

import { URL } from "url"

export const defaultAccessControlAllowedOrigins = []
export const defaultAccessControlAllowedMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
export const defaultAccessControlAllowedHeaders = ["x-requested-with"]

export const generateAccessControlHeaders = ({
  request: { headers },
  accessControlAllowedOrigins = defaultAccessControlAllowedOrigins,
  accessControlAllowRequestOrigin = false,
  accessControlAllowedMethods = defaultAccessControlAllowedMethods,
  accessControlAllowRequestMethod = false,
  accessControlAllowedHeaders = defaultAccessControlAllowedHeaders,
  accessControlAllowRequestHeaders = false,
  accessControlAllowCredentials = true,
  // by default OPTIONS request can be cache for a long time, it's not going to change soon ?
  // we could put a lot here, see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age
  accessControlMaxAge = 600,
} = {}) => {
  const vary = []

  const allowedOriginArray = [...accessControlAllowedOrigins]
  if (accessControlAllowRequestOrigin) {
    if ("origin" in headers && headers.origin !== "null") {
      allowedOriginArray.push(headers.origin)
      vary.push("origin")
    } else if ("referer" in headers) {
      allowedOriginArray.push(hrefToOrigin(headers.referer))
      vary.push("referer")
    } else {
      allowedOriginArray.push("*")
    }
  }

  const allowedMethodArray = [...accessControlAllowedMethods]
  if (accessControlAllowRequestMethod && "access-control-request-method" in headers) {
    const requestMethodName = headers["access-control-request-method"]
    if (!allowedMethodArray.includes(requestMethodName)) {
      allowedMethodArray.push(requestMethodName)
      vary.push("access-control-request-method")
    }
  }

  const allowedHeaderArray = [...accessControlAllowedHeaders]
  if (accessControlAllowRequestHeaders && "access-control-request-headers" in headers) {
    const requestHeaderNameArray = headers["access-control-request-headers"].split(", ")
    requestHeaderNameArray.forEach((headerName) => {
      const headerNameLowerCase = headerName.toLowerCase()
      if (!allowedHeaderArray.includes(headerNameLowerCase)) {
        allowedHeaderArray.push(headerNameLowerCase)
        if (!vary.includes("access-control-request-headers")) {
          vary.push("access-control-request-headers")
        }
      }
    })
  }

  return {
    "access-control-allow-origin": allowedOriginArray.join(", "),
    "access-control-allow-methods": allowedMethodArray.join(", "),
    "access-control-allow-headers": allowedHeaderArray.join(", "),
    "access-control-allow-credentials": accessControlAllowCredentials,
    "access-control-max-age": accessControlMaxAge,
    ...(vary.length ? { vary: vary.join(", ") } : {}),
  }
}

const hrefToOrigin = (href) => new URL(href).origin
