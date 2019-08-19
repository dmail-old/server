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
const bodyAsBuffer = readFileSync(`${testFolderPath}/file.js`)
const expected = {
  status: 200,
  headers: {
    "content-length": bodyAsBuffer.length,
    "content-type": "application/javascript",
    etag: `"20-cXagzQt5IlWM1Fc0XXcmMtPeNKo"`,
  },
  body: bodyAsBuffer,
}
assert({ actual, expected })
