import { assert } from "@dmail/assert"
import { startServer } from "../../index.js"

const fetch = import.meta.require("node-fetch")

const server = await startServer({
  protocol: "http",
  port: 8998,
  logLevel: "off",
  cors: true,
  keepProcessAlive: false,
  requestToResponse: () => {
    return {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
      body: "ok",
    }
  },
})

const response = await fetch(server.origin, {
  method: "OPTIONS",
  headers: {
    origin: "http://example.com:80",
    "access-control-request-headers": "x-module-referer",
    "access-control-request-method": "GET",
  },
})
const headers = {}
response.headers.forEach((value, key) => {
  headers[key] = value
})
const actual = headers
const expected = {
  "access-control-allow-credentials": "true",
  "access-control-allow-headers": "x-requested-with, content-type, accept",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS, x-module-referer",
  "access-control-allow-origin": "http://example.com:80",
  "access-control-max-age": "600",
  connection: "close",
  "content-length": "0",
  date: response.headers.get("date"),
  vary: "origin, access-control-request-method, access-control-request-headers",
}
assert({ actual, expected })
