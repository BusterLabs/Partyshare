const { basename } = require('path');
const fse = require('fs-extra');
const fs = require('fs');

/**
 * Filter function for ignoring hidden files.
 * @param {String} fileName
 * @return {boolean}
 */
const filterHiddenFiles = (fileName) => {
    const base = basename(fileName);
    return !base.startsWith('.');
};

/**
 * Ensure a directory exists, and list the contents.
 * @param {String} dirPath
 * @return {Promise}
 */
const getFiles = (dirPath) => {
    return new Promise((resolve, reject) => {
        fse.ensureDir(dirPath, (ensureErr) => {
            if (ensureErr) {
                return reject(ensureErr);
            }

            return fs.readdir(dirPath, (readErr, files) => {
                if (readErr) {
                    return reject(readErr);
                }

                files = files.filter(filterHiddenFiles);
                return resolve(files);
            });
        });
    });
};

/**
 * Stat a file added to IPFS, wrapping the callback style in a promise.
 * @param {Object} file
 * @return {Promise}
 */
const statWithPromise = (file) => {
    return new Promise((resolve, reject) => {
        fs.stat(file.path, (err, stats) => {
            if (err) {
                return reject(err);
            }

            file.stats = stats;
            return resolve(file);
        });
    });
};


module.exports = {
    getFiles,
    statWithPromise,
};

