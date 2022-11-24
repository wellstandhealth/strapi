'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const _ = require('lodash');
const fetch = require('node-fetch');

const publicKey = fs.readFileSync(path.join(__dirname, 'resources/key.pub'));

const noop = () => {};

const noLog = {
  warn: noop,
  info: noop,
};

const internals = {};
const defaultFeatures = {
  bronze: [],
  silver: [],
  gold: ['sso'],
};

module.exports = ({ dir, logger = noLog }) => {
  if (_.has(internals, 'isEE')) return internals.isEE;

  const warnAndReturn = (msg = 'Invalid license. Starting in CE.') => {
    logger.warn(msg);
    internals.isEE = false;
    return false;
  };

  if (process.env.STRAPI_DISABLE_EE === 'true') {
    internals.isEE = false;
    return false;
  }

  const licensePath = path.join(dir, 'license.txt');

  let license;
  if (_.has(process.env, 'STRAPI_LICENSE')) {
    license = process.env.STRAPI_LICENSE;
  } else if (fs.existsSync(licensePath)) {
    license = fs.readFileSync(licensePath).toString();
  }

  if (_.isNil(license)) {
    internals.isEE = false;
    return false;
  }

  try {
    const plainLicense = Buffer.from(license, 'base64').toString();
    const [signatureb64, contentb64] = plainLicense.split('\n');

    const signature = Buffer.from(signatureb64, 'base64');
    const content = Buffer.from(contentb64, 'base64').toString();

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(content);
    verifier.end();

    const isValid = verifier.verify(publicKey, signature);
    if (!isValid) return warnAndReturn();

    internals.licenseInfo = JSON.parse(content);
    internals.features =
      internals.licenseInfo.features || defaultFeatures[internals.licenseInfo.type];

    const expirationTime = new Date(internals.licenseInfo.expireAt).getTime();
    if (expirationTime < new Date().getTime()) {
      return warnAndReturn('License expired. Starting in CE');
    }
  } catch (err) {
    return warnAndReturn();
  }

  // fake refetch of features to test
  setInterval(async () => {
    const res = await fetch('http://localhost:5000/features');

    try {
      const { features } = await res.json();

      console.log('Feature flag update', features);
      // update features
      internals.features = features;
    } catch (error) {
      console.log(error);
    }
  }, 10000);

  internals.isEE = true;
  return true;
};

Object.defineProperty(module.exports, 'licenseInfo', {
  get() {
    mustHaveKey('licenseInfo');
    return internals.licenseInfo;
  },
  configurable: false,
  enumerable: false,
});

Object.defineProperty(module.exports, 'isEE', {
  get() {
    mustHaveKey('isEE');
    return internals.isEE;
  },
  configurable: false,
  enumerable: false,
});

Object.defineProperty(module.exports, 'features', {
  get() {
    return {
      isEnabled(feature) {
        return internals.features.includes(feature);
      },
      getEnabled() {
        return internals.features;
      },
    };
  },
  configurable: false,
  enumerable: false,
});

const mustHaveKey = (key) => {
  if (!_.has(internals, key)) {
    const err = new Error('Tampering with license');
    // err.stack = null;
    throw err;
  }
};
