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
  requestToResponse: ({ ressource, method, headers }) =>
    serveFile(`${__dirname}${ressource}`, {
      method,
      headers,
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

When true, server will kill any process currently listening the port it wants to listen.<br/>
Passing `forcePort` to true when `port` is `0` will throw because it makes no sense.<br />

If you don't pass `protocol` option, its value will be:

```js
false
```

### requestToResponse(request)

A function receiving a `request` and responsible to produce a `response`.<br />
When `requestToResponse` returns `null` or `undefined` server respond to that request with `501 Not implemented`.

If you don't pass `requestToResponse`, the value will be

```js
const requestToResponse = () => null
```

Below are more information on `request` and `response` objects.

#### request

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

Here is how you could read `request.body`:

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

## `firstService`

`firstService` helps you to create complex `requestToResponse`.

```js
import { firstService, startServer } from "@dmail/server"

startServer({
  requestToResponse: ({ ressource, method, headers }) => {
    return firstService(
      () => {
        if (ressource !== "/") return null
        return {
          status: 204,
        }
      },
      () => {
        if (ressource !== "/answer") return null
        return {
          status: 200,
          headers: { "content-type": "text/plain" },
          body: "answer is 42",
        }
      },
    )
  },
})
```

The server above:

- sends `204 no content` for `/`
- sends `200 ok` with `answer is 42` body for `/answer`
- sends `501 not implemented` for all other request

`firstService` works like this:

1. It accepts 0 or more function.<br />
2. Set `serviceCandidate` to the first function<br />
3. Calls `serviceCandidate` and awaits its `return value`.<br />
4. If `return value` is a non null object it is returned.<br />
   Otherwise, set `serviceCandidate` to the next function and go to step 3

## `serveFile(ressource, options = {})`

`serveFile` is an async function that will search for a file on your filesysten and produce a response for it.<br />
Example:

```js
import { serveFile, defaultContentTypeMap } from "@dmail/server"

const response = await serveFile("/Users/you/folder/index.html", {
  method: "GET",
  headers: {
    "if-modified-since": "Wed, 21 Oct 2015 07:28:00 GMT",
  },
  cacheStrategy: "mtime",
  contentTypeMap: {
    ...defaultContentTypeMap,
    "application/json": {
      extensions: ["json", "json2"],
    },
  },
})
```

Most often you will populate `method` and `headers` with a request like this:

```js
import { serveFile, startServer } from "@dmail/server"

startServer({
  requestToResponse: ({ ressource, methods, headers }) =>
    serveFile(`${__dirname}${ressource}`, {
      method,
      headers,
    }),
})
```

### method

When method is not `HEAD` or `GET` the returned response correspond to `501 not implemented`.

### headers

Two header will be checked in this optionnal object: `if-modified-since` and `if-none-match`.

### cacheStrategy

When `"mtime"`: response will contain `"last-modified"` header<br />
When `"etag"`: response will contain `"etag"` header<br />
When `"none"`: response will contain `"cache-control": "no-store"` header<br />

Default value: `"mtime"`.

### contentTypeMap

There is a defaultContentTypeMap for well known mapping between file extension and content type header.<br />
You can use this option to override it.
