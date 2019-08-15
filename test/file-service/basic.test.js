import { readFileSync } from "fs"
import {
  importMetaURLToFolderPath,
  operatingSystemPathToPathname,
} from "@jsenv/operating-system-path"
import { assert } from "@dmail/assert"
import { serveFile } from "../../index.js"

const testFolderPath = importMetaURLToFolderPath(import.meta.url)
const ressource = "/file.js?ok=true"
const filePathname = `${operatingSystemPathToPathname(testFolderPath)}${ressource}`

const actual = await serveFile(filePathname, {
  cacheStrategy: "etag",
})
const content = String(readFileSync(`${testFolderPath}/file.js`))
const length = Buffer.byteLength(content)
const expected = {
  status: 200,
  headers: {
    "content-length": length,
    "content-type": "application/javascript",
    etag: `"20-cXagzQt5IlWM1Fc0XXcmMtPeNKo"`,
  },
  body: content,
}
assert({ actual, expected })
