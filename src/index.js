import fs       from 'fs';
import path     from 'path';
import async    from 'async';
import rimraf   from 'rimraf';
import mkdirp   from 'mkdirp';
import userHome from 'user-home';
import {
  generateRootCA,
  generateCertForHostname
} from './genetator';

const DEFAULTS = {
  dir: path.join(userHome, '.cert'),
  name: 'root'
};

function certExists(...files) {
  return new Promise((resolve, reject) => {

    async.every(files, (file, next) => {

      fs.access(file, error => {
        next(null, !error);
      });

    }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        // if result is true then every file exists
        resolve(result);
      }
    });
  });
}

function createCerts(...files) {
  return new Promise((resolve, reject) => {

    const arr = files.map(file => next => {
      fs.writeFile(file.path, file.content, { encoding: 'utf-8' }, error => {
        next(null, !error);
      });
    });

    async.parallel(arr, error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function readCerts(certFile, keyFile) {
  return new Promise((resolve, reject) => {

    const arr = [
      certFile,
      keyFile
    ].map(file => next => fs.readFile(file, { encoding: 'utf-8' }, next));

    async.parallel(arr, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve({
          cert: results[0],
          key: results[1]
        });
      }
    });
  });
}


class Generator {

  constructor(options = {}) {

    this.options = { ...DEFAULTS, ...options };

    this.dir   = path.resolve(this.options.dir);
    this.cache = {};

    this.rootKey  = null;
    this.rootCert = null;

    this.rootKeyPath  = path.join(this.dir, `${this.options.name}.key`);
    this.rootCertPath = path.join(this.dir, `${this.options.name}.crt`);
  }

  generateRootCA() {

    return new Promise((resolve, reject) => {

      async.waterfall([

        next => {
          this.clearCerts().then(next, next);
        },

        next => {
          mkdirp(this.dir, error => {
            if (error) {
              next(error);
            } else {
              next();
            }
          });
        },

        next => {

          let { privateKey, certificate } = generateRootCA();

          createCerts({
            path: this.rootCertPath,
            content: certificate
          }, {
            path: this.rootKeyPath,
            content: privateKey
          })
            .then({
              cert: certificate,
              key: privateKey
            }, next)
            .catch(next);
        }
      ], (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  getCertificate(hostname) {

    return new Promise((resolve, reject) => {

      const cached = this.cache[hostname] || {};

      if (cached.cert && cached.key) {
        resolve(cached);
      } else {

        let keyFile  = path.join(this.dir, `${hostname}.key`);
        let certFile = path.join(this.dir, `${hostname}.crt`);

        async.waterfall([

          // check root cert cache
          next => {
            if (!this.rootCert || !this.rootKey) {
              readCerts(this.rootCertPath, this.rootKeyPath)
                .then(ret => {
                  this.rootKey  = ret.key;
                  this.rootCert = ret.cert;
                  next(null);
                })
                .catch(next);
            } else {
              next(null);
            }
          },

          // create
          next => {

            certExists(certFile, keyFile)
              .then(exist => {
                if (!exist) {
                  let ret = generateCertForHostname(hostname, {
                    key: this.rootKey,
                    cert: this.rootCert
                  });

                  createCerts({
                    path: certFile,
                    content: ret.certificate
                  }, {
                    path: keyFile,
                    content: ret.privateKey
                  }).then(next, next);
                } else {
                  next();
                }
              });
          },

          // read
          next => {

            readCerts(certFile, keyFile)
              .then(ret => {
                this.cache[hostname] = ret;
                next(null, ret);
              })
              .catch(next);
          }
        ], (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      }
    });
  }

  isRootCAExists() {
    return certExists(this.rootCertPath, this.rootKeyPath);
  }

  clearCerts() {
    return new Promise((resolve, reject) => {
      this.isRootCAExists()
        .then(exists => {
          if (exists) {
            rimraf(this.dir, (error) => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            });
          } else {
            resolve();
          }
        });
    });
  }
}


export default Generator;
