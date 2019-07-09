// https://github.com/digitalbazaar/forge/blob/master/examples/create-cert.js
// https://github.com/digitalbazaar/forge/issues/660#issuecomment-467145103

const forge = import.meta.require("node-forge")

export const createSelfSignature = () => {
  const { pki, sha256 } = forge

  const certificate = pki.createCertificate()
  const { privateKey, publicKey } = pki.rsa.generateKeyPair(1024)
  certificate.publicKey = publicKey
  certificate.serialNumber = "01"
  certificate.validity.notBefore = new Date()
  certificate.validity.notAfter = new Date()
  certificate.validity.notAfter.setFullYear(certificate.validity.notBefore.getFullYear() + 1)
  const certificateAttributes = [
    {
      name: "commonName",
      value: "https://github.com/jsenv/jsenv-server",
    },
    {
      name: "countryName",
      value: "FR",
    },
    {
      shortName: "ST",
      value: "Alpes Maritimes",
    },
    {
      name: "localityName",
      value: "Valbonne",
    },
    {
      name: "organizationName",
      value: "jsenv",
    },
    {
      shortName: "OU",
      value: "jsenv server",
    },
  ]
  certificate.setSubject(certificateAttributes)
  certificate.setIssuer(certificateAttributes)
  const certificateExtensions = [
    {
      name: "basicConstraints",
      critical: true,
      cA: false,
    },
    {
      name: "keyUsage",
      critical: true,
      digitalSignature: true,
      keyEncipherment: true,
    },
    {
      name: "extKeyUsage",
      serverAuth: true,
    },
    {
      name: "authorityKeyIdentifier",
      keyIdentifier: certificate.generateSubjectKeyIdentifier().getBytes(),
    },
    {
      name: "subjectAltName",
      altNames: [
        {
          type: 7, // IP
          ip: "127.0.0.1",
        },
      ],
    },
  ]
  certificate.setExtensions(certificateExtensions)

  // self-sign certificate
  certificate.sign(privateKey, sha256.create())

  return {
    publicKeyPem: pki.publicKeyToPem(publicKey),
    privateKeyPem: pki.privateKeyToPem(privateKey),
    certificatePem: pki.certificateToPem(certificate),
  }
}
