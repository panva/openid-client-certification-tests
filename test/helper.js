'use strict';

/* eslint-disable no-console */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Issuer } = require('openid-client');
const got = require('got');
const fs = require('fs');

const rpId = 'node-openid-client';
const root = 'https://rp.certification.openid.net:8080';
const redirectUri = `https://${rpId}.dev/cb`;

const profile = (() => {
  const last = process.argv[process.argv.length - 1];
  if (last.startsWith('@')) {
    return last.slice(1);
  }
  return undefined;
})();

before(function () {
  return got(`${root}/log/${rpId}`).then((logIndex) => {
    if (/Clear all test logs/.exec(logIndex.body)) {
      console.log('Clearing logs');
      return got(`${root}/clear/${rpId}`).then(() => {
        console.log('Clearing logs - DONE');
      });
    }
    return Promise.resolve();
  });
});

if (profile) {
  after(function () {
    return got(`${root}/log/${rpId}`).then((logIndex) => {
      if (/Download tar file/.exec(logIndex.body)) {
        console.log('Downloading logs');
        const filename = `${profile}-${rpId}.tar`;
        return got(`${root}/mktar/${rpId}`)
          .then(tar => fs.writeFileSync(filename, tar.body))
          .then(() => {
            console.log('Downloading logs - DONE -', filename);
          });
      }
      return Promise.resolve();
    });
  });
}

module.exports = {
  noFollow: { followRedirect: false },
  root,
  rpId,
  redirect_uri: redirectUri,
  redirect_uris: [redirectUri],
  async register(testId, metadata, keystore) {
    const issuer = await Issuer.discover(`${root}/${rpId}/${testId}`);
    const client = await issuer.Client.register(metadata, keystore);
    return { issuer, client };
  },
  reject() { throw new Error('expected a rejection'); },
};
