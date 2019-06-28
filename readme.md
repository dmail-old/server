# Server

[![npm package](https://img.shields.io/npm/v/@dmail/server.svg)](https://www.npmjs.com/package/@dmail/server)
[![build](https://travis-ci.com/dmail/server.svg?branch=master)](http://travis-ci.com/dmail/server)
[![codecov](https://codecov.io/gh/dmail/server/branch/master/graph/badge.svg)](https://codecov.io/gh/dmail/server)

> Simplified api to create server using node.js.

## Installation

```console
npm install @dmail/server
```

## Basic example

The following code starts a server listening to `http://127.0.0.1:8080` and responding `Hello world` as plain text.

```js
import { startServer } from "@dmail/server"

startServer({
  protocol: "http",
  ip: "127.0.0.1",
  port: 8080,
  requestToResponse: () => {
    return {
      status: 200,
      headers: {
        "content-type": "text/plain",
      },
      body: "Hello world",
    }
  },
})
```

## File example

The following code starts a server listening to `http://127.0.0.1:8080` serving files of the current directory.

```js
import { startServer, serveFile } from "@dmail/server"

startServer({
  protocol: "http",
  ip: "127.0.0.1",
  port: 8080,
  requestToResponse: (request) =>
    serveFile(`${__dirname}${request.ressource}`, {
      method: request.method,
      headers: request.headers,
      canReadDirectory: true,
      cacheStrategy: "etag",
    }),
})
```

## `startServer`

### protocol

If you don't pass `protocol` option, its value will be:

```js
"http"
```

### ip

If you don't pass `ip` option, its value will be:

```js
"127.0.0.1"
```

### port

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

### forcePort

When true, server will kill any process currently listening the port is wants to listen.<br/>
Do not pass this to true when port is `0` because it's be useless.<br />

If you don't pass `protocol` option, its value will be:

```js
false
```

### requestToResponse(request)

A function receiving a request object and responsible to produce a response object.<br />
When `requestToResponse` returns `null` or `undefined` server will response to that request with `501 Not implemented`.

If you don't pass `requestToResponse`, the value will be

```js
const requestToResponse = () => null
```

Below are more information on request and response objects.

#### request

A get request example:

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

Here is how you could read the request body:

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

#### response

A response with a string body:

```js
const response = {
  status: 200,
  headers: { "content-type": "text/plain" },
  body: "Hello world",
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

### cors

When true, sever adds cross origin ressource sharing headers to all your responses. It means your server can be requested from an other domain.

If you don't pass `cors` option, its value will be:

```js
false
```

### logLevel

Controls what server logs in the terminal.

There is 5 log levels, you can use them like this:

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

### stopOnSIGINT

When true, server will be stopped when terminal receives SIGINT, if you do ctrl+c in your terminal for instance.

If you don't pass `stopOnSIGINT` option, its value will be:

```js
true
```

### stopOnExit

When true, server will be stopped when process exits.

If you don't pass `stopOnExit` option, its value will be:

```js
true
```

### stopOnError

When true, server will be stopped if a request produce a response with a 500 status.

If you don't pass `stopOnError` option, its value will be:

```js
true
```

### keepProcessAlive

When true, server keeps process alive.<br />
When false, if nothing keeps the process alive node process will end even if your server is still listening.

If you don't pass `keepProcessAlive` option, its value will be:

```js
true
```

### startedCallback({ origin })

Optionnal function called when server is started.<br />
It receives `origin`, a string representing where is listening like `http://127.0.0.1:8080`.

### stoppedCallback({ reason })

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

`reason` might also be a value you would pass yourself like this:

```js
import { startServer } from "@dmail/server"

const { stop } = await startServer({
  stoppedCallback: ({ reason }) => {
    reason === 42
  },
})
stop(42)
```

## `serveFile`

TODO: write documentation

## `firstService`

TODO: write documentation
