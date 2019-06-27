import fs from "fs"
import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import { assert } from "@dmail/assert"
import { serveFile } from "../../index.js"

const testFolderPath = importMetaURLToFolderPath(import.meta.url)

const ressource = "/file.js"
const actual = await serveFile(`${testFolderPath}${ressource}`, {
  cacheStrategy: "etag",
})
const content = String(fs.readFileSync(`${testFolderPath}${ressource}`))
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
