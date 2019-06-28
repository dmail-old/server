# Server

[![npm package](https://img.shields.io/npm/v/@dmail/server.svg)](https://www.npmjs.com/package/@dmail/server)
[![build](https://travis-ci.com/dmail/server.svg?branch=master)](http://travis-ci.com/dmail/server)
[![codecov](https://codecov.io/gh/dmail/server/branch/master/graph/badge.svg)](https://codecov.io/gh/dmail/server)

> A simple node server.

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

TODO: write documentation

## `serveFile`

TODO: write documentation

## `firstService`

TODO: write documentation
