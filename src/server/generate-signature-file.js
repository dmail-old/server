import { fileWrite } from "@dmail/helper"
import { hrefToPathname, pathnameToDirname } from "@jsenv/module-resolution"
import { pathnameToOperatingSystemPath } from "@jsenv/operating-system-path"
import { createSelfSignature } from "./createSelfSignature.js"

const { publicKeyPem, privateKeyPem, certificatePem } = createSelfSignature()

const signatureRelativePath = `/signature.js`
const folderPathname = pathnameToDirname(hrefToPathname(import.meta.url))
const signaturePath = pathnameToOperatingSystemPath(`${folderPathname}${signatureRelativePath}`)

const pemToJavaScriptValue = (pem) => {
  pem = pem.replace(/\r\n/g, "\n")
  pem = pem.trim()
  return `\`${pem}\``
}

fileWrite(
  signaturePath,
  `export const privateKey = ${pemToJavaScriptValue(privateKeyPem)}

export const publicKey = ${pemToJavaScriptValue(publicKeyPem)}

export const certificate = ${pemToJavaScriptValue(certificatePem)}
`,
).then(() => {
  console.log(`-> ${signaturePath}`)
})
