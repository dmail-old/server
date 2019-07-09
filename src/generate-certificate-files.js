import { fileWrite } from "@dmail/helper"
import { hrefToPathname, pathnameToDirname } from "@jsenv/module-resolution"
import { pathnameToOperatingSystemPath } from "@jsenv/operating-system-path"
import { createSelfSignature } from "./server/index.js"

const { privateKeyPem, certificatePem } = createSelfSignature()

const certificateRelativePath = `/src/certificate.pem`
const privateKeyRelativePath = `/src/privateKey.pem`
const projectPathname = pathnameToDirname(pathnameToDirname(hrefToPathname(import.meta.url)))
const privateKeyPath = pathnameToOperatingSystemPath(`${projectPathname}${privateKeyRelativePath}`)
const certificatePath = pathnameToOperatingSystemPath(
  `${projectPathname}${certificateRelativePath}`,
)

fileWrite(privateKeyPath, privateKeyPem).then(() => {
  console.log(`-> ${privateKeyRelativePath}`)
})
fileWrite(certificatePath, certificatePem).then(() => {
  console.log(`-> ${certificateRelativePath}`)
})
