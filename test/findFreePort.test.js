import { assert } from "@dmail/assert"
import { findFreePort } from "../index.js"

const port = await findFreePort()
assert({
  actual: typeof port,
  expected: "number",
})
