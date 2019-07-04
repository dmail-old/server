// https://www.w3.org/TR/cors/
// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

import { URL } from "url"

export const requestToAccessControlHeaders = (
  { headers },
  {
    allowCredentials = true,
    // by default OPTIONS request can be cache for a long time, it's not going to change soon ?
    // we could put a lot here, see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age
    maxAge = 600,
  } = {},
) => {
  const vary = []
  let allowedOrigins
  if ("origin" in headers && headers.origin !== "null") {
    allowedOrigins = [headers.origin]
    vary.push("origin")
  } else if ("referer" in headers) {
    allowedOrigins = [hrefToOrigin(headers.referer)]
    vary.push("referer")
  } else {
    allowedOrigins = ["*"]
  }

  const allowedMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  if ("access-control-request-method" in headers) {
    headers["access-control-request-method"].split(", ").forEach((methodName) => {
      if (!allowedMethods.includes(methodName)) {
        allowedMethods.push(methodName)
      }
    })
    vary.push("access-control-request-method")
  }

  const allowedHeaders = ["x-requested-with", "content-type", "accept"]

  if ("access-control-request-headers" in headers) {
    headers["access-control-request-headers"].split(", ").forEach((headerName) => {
      const headerNameLowerCase = headerName.toLowerCase()
      if (!allowedMethods.includes(headerNameLowerCase)) {
        allowedMethods.push(headerNameLowerCase)
      }
    })
    vary.push("access-control-request-headers")
  }

  return {
    "access-control-allow-origin": allowedOrigins.join(", "),
    "access-control-allow-methods": allowedMethods.join(", "),
    "access-control-allow-headers": allowedHeaders.join(", "),
    "access-control-allow-credentials": allowCredentials,
    "access-control-max-age": maxAge,
    ...(vary.length ? { vary: vary.join(", ") } : {}),
  }
}

const hrefToOrigin = (href) => new URL(href).origin
