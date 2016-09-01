import forge from 'node-forge';

const METADATA = {
  commonName: 'Sample Service',
  countryName: 'US',
  stateOrProvinceName: 'Wisconsin',
  localityName: 'Madison',
  organizationName: 'University of Wisconsin -- Madison',
  organizationalUnitName: 'Computer Sciences Department',
  emailAddress: 'email@sample.com'
};

const EXTENSIONS = [{
  name: 'basicConstraints',
  cA: true
}];


function toNameValue(obj = {}) {
  return Object.keys(obj).map((key) => ({
    name: key,
    value: obj[key]
  }));
}

function getKeysAndCert(serialNumber = Math.floor(Math.random() * 100000)) {

  let keys = forge.pki.rsa.generateKeyPair(2048);
  let cert = forge.pki.createCertificate();

  cert.publicKey    = keys.publicKey;
  cert.serialNumber = String(serialNumber);

  cert.validity.notBefore = new Date();
  cert.validity.notAfter  = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);

  return {
    keys,
    cert
  };
}

function generateRootCA(options = {}) {

  let { keys, cert } = getKeysAndCert();

  let subject    = toNameValue({ ...METADATA, ...options.subject });
  let issuer     = toNameValue({ ...METADATA, ...options.issuer });
  let extensions = [...EXTENSIONS, ...(options.extensions || [])];

  cert.setSubject(subject);
  cert.setIssuer(issuer);
  cert.setExtensions(extensions);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  return {
    privateKey: forge.pki.privateKeyToPem(keys.privateKey),
    publicKey: forge.pki.publicKeyToPem(keys.publicKey),
    certificate: forge.pki.certificateToPem(cert)
  };
}

function generateCertForHostname(domain, rootCAConfig) {

  // generate a serialNumber for domain
  let md = forge.md.md5.create();

  md.update(domain);

  let { keys, cert } =  getKeysAndCert(md.digest().toHex());

  let caCert = forge.pki.certificateFromPem(rootCAConfig.cert);
  let caKey  = forge.pki.privateKeyFromPem(rootCAConfig.key);

  let subject = toNameValue({ ...METADATA, ...{ commonName: domain } });

  cert.setIssuer(caCert.subject.attributes); // issuer from CA
  cert.setSubject(subject);

  cert.sign(caKey, forge.md.sha256.create());

  return {
    privateKey: forge.pki.privateKeyToPem(keys.privateKey),
    publicKey: forge.pki.publicKeyToPem(keys.publicKey),
    certificate: forge.pki.certificateToPem(cert)
  };
}


export {
  generateRootCA,
  generateCertForHostname
};
