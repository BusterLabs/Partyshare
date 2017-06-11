const { basename } = require('path');
const fse = require('fs-extra');
const fs = require('fs');

const filterHiddenFiles = (item) => {
    const base = basename(item);
    return base === '.' || base[0] !== '.';
};

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
                // Remove hidden files
                files = files.filter((file) => file.startsWith('.') === false);
                return resolve(files);
            });
        });
    });
};


module.exports = {
    getFiles,
};

