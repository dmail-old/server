import { assert } from "@dmail/assert"
import { createSelfSignature } from "../../index.js"

const actual = createSelfSignature()
const expected = {
  privateKey: actual.privateKey,
  publicKey: actual.publicKey,
  certificate: actual.certificate,
}
assert({ actual, expected })
