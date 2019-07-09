import { assert } from "@dmail/assert"
import { createSelfSignature } from "../../index.js"

const actual = createSelfSignature()
const expected = {
  publicKeyPem: actual.publicKeyPem,
  privateKeyPem: actual.privateKeyPem,
  certificatePem: actual.certificatePem,
}
assert({ actual, expected })
