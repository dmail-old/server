# `startServer`

Documents how `startServer` function behaves.

## protocol

```js
import { startServer } from "@dmail/server"

startServer({
  protocol: "https",
})
```

If you don't pass `protocol` option, its value will be:

```js
"http"
```

### `https` protocol certificate

If you use `https` protocol a default self signed certificate will be used.<br />
It can be found inside [/server/signature.js](https://github.com/dmail/server/blob/4d40f790adebaa14b7482a9fb228e0c1f63e94b7/src/server/signature.js#L24).<br />
You may want to add this certificate to your system/browser trusted certificates.

You can also pass your own certificate.<br />
The code below is a basic example showing how you could pass your own certificate.

```js
import { readFileSync } from "fs"
import { startServer } from "@dmail/server"

startServer({
  protocol: "https",
  signature: {
    privateKey: readFileSync(`${__dirname}/ssl/private.pem`),
    certificate: readFileSync(`${__dirname}/ssl/cert.pem`),
  },
})
```

## ip

```js
import { startServer } from "@dmail/server"

startServer({
  ip: "192.168.1.1",
})
```

If you don't pass `ip` option, its value will be:

```js
"127.0.0.1"
```

You can pass an empty string to listen any ip.

## port

```js
import { startServer } from "@dmail/server"

startServer({
  port: 80,
})
```

A value of `0` means server will listen to a random available port.<br />
In that case, if you want to know the listened port you can do this:

```js
const { origin } = await startServer()
```

And `origin` could be something like `http://127.0.0.1:65289` for instance.

If you don't pass `port` option, its value will be:

```js
0
```

## forcePort

```js
import { startServer } from "@dmail/server"

startServer({
  port: 80,
  forcePort: true,
})
```

When true, server will kill any process currently listening the port it wants to listen.<br/>
Passing `forcePort` to true when `port` is `0` will throw because it makes no sense.<br />

If you don't pass `protocol` option, its value will be:

```js
false
```

## requestToResponse(request)

A function receiving a `request` and responsible to produce a `response`.<br />
When `requestToResponse` returns `null` or `undefined` server respond to that request with `501 Not implemented`.

If you don't pass `requestToResponse`, the value will be

```js
const requestToResponse = () => null
```

Below are more information on `request` and `response` objects.

### request

```js
const request = {
  origin: "http://127.0.0.1:8080",
  ressource: "/index.html?param=1",
  method: "GET",
  headers: { accept: "text/html" },
  body: undefined,
}
```

When request method is `GET` or `HEAD`, `request.body` is `undefined`.<br />
When request method is `POST`, `PUT`, `PATCH`, `request.body` is an observable object.<br />

Here is how to get `request.body` as string:

```js
const requestToResponse = async ({ body }) => {
  const requestBodyAsText = await new Promise((resolve, reject) => {
    const bufferArray = []
    body.subscribe({
      error: reject,
      next: (buffer) => {
        bufferArray.push(buffer)
      },
      complete: () => {
        const bodyAsBuffer = Buffer.concat(bufferArray)
        const bodyAsString = bodyAsBuffer.toString()
        resolve(bodyAsString)
      },
    })
  })
}
```

### response

A response with a string body:

```js
const response = {
  status: 200,
  headers: { "content-type": "text/plain" },
  body: "Hello world",
}
```

A response with a buffer body:

```js
const response = {
  status: 200,
  headers: { "content-type": "text/plain" },
  body: Buffer.from("Hello world")
}
```

A response with a readable stream body:

```js
const { createReadStream } = require("fs")

const response = {
  status: 200,
  headers: { "content-type": "text/plain" },
  body: createReadStream("/User/you/folder/file.txt"),
}
```

A response with an observable body:

```js
const response = {
  status: 200,
  headers: { "content-type": "text/plain" },
  body: {
    [Symbol.observable]: () => {
      return {
        subscribe: ({ next, complete }) => {
          next("Hello world")
          complete()
        },
      }
    },
  },
}
```

## accessControl options

```js
import { startServer } from "@dmail/server"

startServer({
  accessControlAllowRequestOrigin: true,
  accessControlAllowRequestMethod: true,
  accessControlAllowRequestHeaders: true,
  accessControlAllowCredentials: true,
})
```

All options starting with `accessControl` are related to cross origin ressource sharing, also called CORS.<br />
As soon as you pass `accessControlAllowRequestOrigin` or `accessControlAllowedOrigins` it means your server use CORS.<br />
When using CORS all your response will contain CORS headers, even a 500 response.

### accessControlAllowedOrigins

```js
import { startServer } from "@dmail/server"

startServer({
  accessControlAllowedOrigins: ["http://127.0.0.1:80"],
})
```

Origins inside this array will be allowed.<br />
If you don't pass `accessControlAllowedOrigins` option, its value will be:

<!-- prettier-ignore -->
```js
[]
```

### accessControlAllowRequestOrigin

```js
import { startServer } from "@dmail/server"

startServer({
  accessControlAllowRequestOrigin: true,
})
```

When true, any request origin will be allowed.<br />
If you don't pass `accessControlAllowRequestOrigin` option, its value will be:

```js
false
```

### accessControlAllowedMethods

```js
import { startServer } from "@dmail/server"

startServer({
  accessControlAllowRequestOrigin: true,
  accessControlAllowedMethods: ["GET"],
})
```

Method names inside this array will be allowed.<br />
If you don't pass `accessControlAllowedMethods` option, its value will be:

```json
["GET", "POST", "PUT", "DELETE", "OPTIONS"]
```

### accessControlAllowRequestMethod

```js
import { startServer } from "@dmail/server"

startServer({
  accessControlAllowRequestOrigin: true,
  accessControlAllowRequestMethod: true,
})
```

When true, any request method will be allowed.<br />
If you don't pass `accessControlAllowRequestMethod` option, its value will be:

```js
false
```

### accessControlAllowedHeaders

```js
import { startServer } from "@dmail/server"

startServer({
  accessControlAllowRequestOrigin: true,
  accessControlAllowedHeaders: ["x-whatever"],
})
```

Header names inside this array will be allowed.<br />
If you don't pass `accessControlAllowedHeaders` option, its value will be:

```json
["x-requested-with"]
```

### accessControlAllowRequestHeaders

```js
import { startServer } from "@dmail/server"

startServer({
  accessControlAllowRequestOrigin: true,
  accessControlAllowRequestHeaders: true,
})
```

When true, any request headers will be allowed.<br />
If you don't pass `accessControlAllowRequestHeaders` option, its value will be:

```js
false
```

### accessControlAllowCredentials

```js
import { startServer } from "@dmail/server"

startServer({
  accessControlAllowRequestOrigin: true,
  accessControlAllowCredentials: true,
})
```

If you don't pass `accessControlAllowCredentials` option, its value will be:

```js
false
```

### accessControlMaxAge

```js
import { startServer } from "@dmail/server"

startServer({
  accessControlAllowRequestOrigin: true,
  accessControlMaxAge: 400,
})
```

If you don't pass `accessControlMaxAge` option, its value will be:

```js
600
```

## logLevel

```js
import {
  startServer,
  LOG_LEVEL_OFF,
  LOG_LEVEL_ERRORS,
  LOG_LEVEL_ERRORS_AND_WARNINGS,
  LOG_LEVEL_ERRORS_WARNINGS_AND_LOGS,
  LOG_LEVEL_MAXIMUM,
} from "@dmail/server"

startServer({
  logLevel: LOG_LEVEL_OFF,
})
```

If you don't pass `logLevel` option, its value will be:

```js
LOG_LEVEL_ERRORS_WARNINGS_AND_LOGS
```

## stopOnSIGINT

```js
import { startServer } from "@dmail/server"

startServer({
  stopOnSIGINT: false,
})
```

When true, server will be stopped when terminal receives SIGINT, if you do ctrl+c in your terminal for instance.

If you don't pass `stopOnSIGINT` option, its value will be:

```js
true
```

## stopOnExit

```js
import { startServer } from "@dmail/server"

startServer({
  stopOnExit: false,
})
```

When true, server will be stopped when process exits.

If you don't pass `stopOnExit` option, its value will be:

```js
true
```

## stopOnInternalError

```js
import { startServer } from "@dmail/server"

startServer({
  stopOnInternalError: true,
})
```

When true, server will be stopped if a request produce a response with a 500 status.

If you don't pass `stopOnInternalError` option, its value will be:

```js
false
```

## keepProcessAlive

```js
import { startServer } from "@dmail/server"

startServer({
  keeProcessAlive: false,
})
```

When true, server keeps process alive.<br />
When false, if nothing keeps the process alive node process will end even if your server is still listening.

If you don't pass `keepProcessAlive` option, its value will be:

```js
true
```

## startedCallback({ origin })

```js
import { startServer } from "@dmail/server"

startServer({
  startedCallback: ({ origin }) => console.log(`server started at ${origin}`),
})
```

Optionnal function called when server is started.<br />
It receives `origin`, a string representing where is listening like `http://127.0.0.1:8080`.

## stoppedCallback({ reason })

```js
import { startServer } from "@dmail/server"

startServer({
  stoppedCallback: ({ reason }) => console.log(`server stopped because ${reason}`),
})
```

Optionnal function called when server is stopped.<br />
It receive `reason` saying why the server was stopped.<br />

Each possible `reason` is an object you can import like this:

```js
import {
  STOP_REASON_INTERNAL_ERROR,
  STOP_REASON_PROCESS_SIGINT,
  STOP_REASON_PROCESS_BEFORE_EXIT,
  STOP_REASON_PROCESS_HANGUP_OR_DEATH,
  STOP_REASON_PROCESS_DEATH,
  STOP_REASON_PROCESS_EXIT,
  STOP_REASON_NOT_SPECIFIED,
} from "@dmail/server"
```

`reason` might also be a value you passed yourself:

```js
import { startServer } from "@dmail/server"

const { stop } = await startServer({
  stoppedCallback: ({ reason }) => {
    reason === 42
  },
})
stop(42)
```
