# cert-generator

> Generate a root certificate.

[![MIT License](https://img.shields.io/badge/license-MIT_License-green.svg?style=flat-square)](https://github.com/bubkoo/cert-generator/blob/master/LICENSE)

## Installation

```
$ npm install --save cert-generator
```

## Usage

```js
import Generator from 'cert-generator';

/*
  - options.dir   // where should the certificates be save
  - options.name  // the root certificate name
 */
let generator = new Generator([options]);

generator.generateRootCA()
  .then(() => console.log('success'))
  .catch(error => console.log(error));

// get certificate for special hostname
generator.getCertificate('example.com')
  .then(({cert, key}) => {
     console.log(cert);  // the certificate
     console.log(key);   // the private key
  })
  .catch(error => console.log(error));

// check if the root CA is exists  
generator.isRootCAExists()
  .then((exists) => console.log(exists));
  
// clear all certs
generator.clearCerts()
  .then(() => console.log('certs ware cleared.'));
```


## Contributing

Pull requests and stars are highly welcome.

For bugs and feature requests, please [create an issue](https://github.com/bubkoo/cert-generator/issues/new).
