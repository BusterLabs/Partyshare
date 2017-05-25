const { basename } = require('path');
const fse = require('fs-extra');
const klaw = require('klaw');

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

            const items = [];
            return klaw(dirPath, { filter: filterHiddenFiles })
                .on('data', (item) => {
                    if (item.path === dirPath) {
                        return;
                    }

                    if (item.stats.isDirectory()) {
                        return;
                    }

                    items.push(item);
                })
                .on('end', () => {
                    resolve(items);
                });
        });
    });
};


module.exports = {
    getFiles,
};

