# `serveFile(ressource, options = {})`

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
