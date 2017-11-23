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


module.exports = {
    getFiles,
};

