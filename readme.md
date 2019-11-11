# Server

[![npm package](https://img.shields.io/npm/v/@dmail/server.svg)](https://www.npmjs.com/package/@dmail/server)
[![build](https://travis-ci.com/dmail/server.svg?branch=master)](http://travis-ci.com/dmail/server)
[![codecov](https://codecov.io/gh/dmail/server/branch/master/graph/badge.svg)](https://codecov.io/gh/dmail/server)

Simplified api to create server using node.js.

## Table of contents

- [Presentation](#Presentation)
- [Code example](#Code-example)
- [api](#api)
  - [startServer](./docs/start-server.md)
  - [firstService](./docs/first-service.md)
  - [serveFile](./docs/serve-file.md)

## Presentation

dmail/server github repository publishes `@dmail/server` package on github and npm package registries.

`@dmail/server` helps to start server with a simplified api to focus on writing your application code. The api make your code easier to compose and test in isolation.

## Code example

The following code starts a server listening to `http://127.0.0.1:8080` responding `Hello world` as plain text.

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

## api

Api can be found in their own pages

- [startServer](./docs/start-server.md)
- [firstService](./docs/first-service.md)
- [serveFile](./docs/serve-file.md)

## `serveFile` example

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

If you want to know more about `serveFile`, there is a dedicated page documenting it.<br />
— see [`serveFile` documentation](./docs/serve-file-doc.md)

## Installation

```console
npm install @dmail/server@2.4.0
```
