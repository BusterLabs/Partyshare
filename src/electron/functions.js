const { basename } = require('path');
const { IPFS_REPO } = require('./constants.js');
const fse = require('fs-extra');
const klaw = require('klaw');
const ipfsCtl = require('ipfsd-ctl');
const logger = require('electron-log');

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

const getIPFSNode = () => {
    return new Promise((resolve, reject) => {
        ipfsCtl.local(IPFS_REPO, {}, (err, node) => {
            if (err) {
                logger.error('[functions] getIPFSNode', err);
                return reject(err);
            }

            return resolve(node);
        });
    });
};

const initializeIPFS = (node) => {
    return new Promise((resolve, reject) => {
        if (node.initialized) {
            logger.error('[functions] initializeIPFS: node already initialized');
            resolve(node);
            return;
        }

        const options = {
            directory: IPFS_REPO,
            keySize: 2048,
        };

        node.init(options, (err, res) => {
            if (err) {
                logger.error('[functions] initializeIPFS', err);
                return reject(err);
            }

            return resolve(node);
        });
    });
};

const startIPFSDaemon = (node) => {
    return new Promise((resolve, reject) => {
        node.startDaemon((err, daemon) => {
            if (err) {
                logger.error('[functions] startIPFSDaemon', err);
                return reject(err);
            }

            return resolve(daemon);
        });
    });
};

const startIPFS = () => {
    return getIPFSNode()
        .then(initializeIPFS)
        .then(startIPFSDaemon)
        .catch((e) => logger.error('[functions] startIPFS', e));
};

module.exports = {
    getFiles,
    getIPFSNode,
    initializeIPFS,
    startIPFS,
    startIPFSDaemon,
};

