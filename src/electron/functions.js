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
        fse.ensureDir(dirPath, (err) => {
            if (err) {
                return reject(err);
            }

            fs.readdir(dirPath, (err, files) => {
                if (err) {
                    return reject(err);
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

