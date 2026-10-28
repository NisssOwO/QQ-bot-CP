'use strict';

const fs = require('node:fs');
const fsp = fs.promises;

function isAndroidLinkError(error) {
  return error && (error.code === 'EACCES' || error.code === 'EPERM' || error.code === 'ENOSYS' || error.code === 'EXDEV');
}

const nativeLink = fs.link;
fs.link = function androidCompatibleLink(existingPath, newPath, callback) {
  return nativeLink.call(fs, existingPath, newPath, (error) => {
    if (!isAndroidLinkError(error)) return callback(error);
    // The DSH session writer links a same-directory temp file and removes the
    // temp name after publishing. Rename preserves that commit protocol on
    // Android while avoiding unsupported hard-link permissions.
    fs.rename(existingPath, newPath, callback);
  });
};

const nativeLinkSync = fs.linkSync;
fs.linkSync = function androidCompatibleLinkSync(existingPath, newPath) {
  try {
    return nativeLinkSync.call(fs, existingPath, newPath);
  } catch (error) {
    if (!isAndroidLinkError(error)) throw error;
    return fs.renameSync(existingPath, newPath);
  }
};

const nativePromiseLink = fsp.link.bind(fsp);
fsp.link = async function androidCompatiblePromiseLink(existingPath, newPath) {
  try {
    return await nativePromiseLink(existingPath, newPath);
  } catch (error) {
    if (!isAndroidLinkError(error)) throw error;
    return fsp.rename(existingPath, newPath);
  }
};
