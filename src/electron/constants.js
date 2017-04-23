
const { join, resolve } = require('path');
const { homedir } = require('os');
const { format } = require('url');

const __DEV__ = process.env.ENV === 'dev';
const GATEWAY_URL = 'https://gateway.ipfs.io/ipfs';
const ICON_PATH = resolve(__dirname, '..', 'static', 'icons', 'icon-menubar@2x.png');
const INDEX_PATH = format({
    pathname: resolve(__dirname, '..', 'index.html'),
    protocol: 'file:',
    slashes: true,
});
const IPFS_FOLDER = join(homedir(), 'Partyshare');
const IPFS_REPO = join(homedir(), '.partyshare-repo');

module.exports = {
    __DEV__,
    GATEWAY_URL,
    ICON_PATH,
    INDEX_PATH,
    IPFS_FOLDER,
    IPFS_REPO,
};
