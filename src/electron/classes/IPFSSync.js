const EventEmitter = require('events');
const fs = require('fs');
const fse = require('fs-extra');
const logger = require('electron-log');
const ipfsCtl = require('ipfsd-ctl');
const ipfsAPI = require('ipfs-api');
const {
    getFiles,
    statWithPromise,
} = require('../functions.js');
const {
    basename,
    extname,
    join,
} = require('path');
const {
    IPFS_FOLDER,
    IPFS_REPO,
} = require('../constants.js');
const {
    IPC_EVENT_FILES_ADDED,
    IPC_EVENT_STATE_CHANGE,
} = require('../../shared/constants');

const DEFAULTS = {
    folderPath: IPFS_FOLDER,
    autoStart: true,
};

const MAX_RECONNECTS = 5;

/**
* Keep a folder in sync with your IPFS repo. Any files added
* to the folder will be automatically added to IPFS.
* @extends EventEmitter
*/
class IPFSSync extends EventEmitter {
    constructor(options) {
        super();

        const {
            folderPath,
            autoStart,
        } = Object.assign(DEFAULTS, options);

        this._bindMethods();
        this._state = {
            files: [],
            folder: {
                path: folderPath,
                basename: basename(folderPath),
            },
            ipfs: null,
            connectRetries: 0,
            connected: false,
            synced: false,
        };

        if (autoStart) {
            this.start();
        }
    }

    // Privates _______________________________________________________________

    /**
     * Bind any methods used in this class.
     * @return {IPFSSync}
     */
    _bindMethods() {
        logger.info('[IPFSSync] _bindMethods');
        this._addDirectory = this._addDirectory.bind(this);
        this._addFile = this._addFile.bind(this);
        this._connectToExistingDaemon = this._connectToExistingDaemon.bind(this);
        this._connectToIPFS = this._connectToIPFS.bind(this);
        this._getConfig = this._getConfig.bind(this);
        this._getNode = this._getNode.bind(this);
        this._initNode = this._initNode.bind(this);
        this._readAndSyncFiles = this._readAndSyncFiles.bind(this);
        this._retryConnection = this._retryConnection.bind(this);
        this._syncFiles = this._syncFiles.bind(this);
        this.setState = this.setState.bind(this);
        this.start = this.start.bind(this);
        this.quit = this.quit.bind(this);
        this.watch = this.watch.bind(this);
        return this;
    }

    /**
    * Wrap a file in a fake folder, then add it to IPFS to allow for file names
    * in the URL.
    *
    * @param {String} path
    * @return {Promise}
    */
    _addFile(path) {
        logger.info('[IPFSSync] _addFile');
        const fileName = basename(path);
        const fakeDirectory = basename(basename(fileName), extname(fileName)).trim();
        const file = {
            path: join(fakeDirectory, fileName),
            content: fs.createReadStream(path),
        };

        return this.state.ipfs.add([file], { wrap: true })
            .then((result) => {
                const [fileObject, dirObject] = result;
                fileObject.urlPath = encodeURI(join(dirObject.hash, fileName));
                fileObject.name = fileName;
                fileObject.path = path;
                return Promise.resolve([fileObject]);
            });
    }

    /**
     * Add an entire directory to IPFS, using the directory as the root
     * hash.
     *
     * @param {String} path
     * @return {Promise}
     */
    _addDirectory(path) {
        logger.info('[IPFSSync] _addDirectory');
        return this.state.ipfs.util.addFromFs(path, { recursive: true })
            .then((objects) => {
                return new Promise((resolve) => {
                    const dirName = basename(path);
                    const folder = objects.find((item) => dirName.indexOf(item.path) > -1);
                    const files = objects.filter((item) => item !== folder).map((file) => {
                        file.name = basename(file.path);
                        file.urlPath = encodeURI(file.path.replace(folder.path, folder.hash));
                        file.path = join(this.state.folder.path, file.path);
                        return file;
                    });
                    return resolve(files);
                });
            });
    }

    /**
     * Add the whole folder to IPFS, resolving with the new folder
     * hash and a list of files.
     * @param  {Array} fileNames
     * @return {Promise}
     */
    _syncFiles(fileNames) {
        logger.info('[IPFSSync] _syncFiles');

        if (fileNames.length < 1) {
            // No files to sync
            return this.setState({ files: [], synced: true });
        }

        const promises = fileNames.map((fileName) => {
            return new Promise((resolve, reject) => {
                const fullPath = join(this.state.folder.path, fileName);

                fs.stat(fullPath, (err, stats) => {
                    if (err) {
                        return reject(err);
                    }

                    if (stats.isDirectory()) {
                        return this._addDirectory(fullPath)
                            .then(resolve)
                            .catch(reject);
                    }

                    return this._addFile(fullPath)
                        .then(resolve)
                        .catch(reject);
                });
            });
        });

        return Promise.all(promises)
            .then((groups) => [].concat(...groups))
            .then((files) => Promise.all(files.map((file) => statWithPromise(file))))
            .then((files) => this.setState({ files, synced: true }));
    }

    /**
     * Retry connecting to the daemon.
     */
    _retryConnection() {
        logger.info('[IPFSSync] _retryConnection');

        if (this.state.connectRetries > MAX_RECONNECTS) {
            logger.error('[IPFSSync] _retryConnection: Exceeded max connection retries', this.state.connectRetries);
            return;
        }

        this.setState({
            connectRetries: this.state.connectRetries + 1,
            synced: false,
        });

        this.start()
            .then(() => this.setState({ connectRetries: 0 }))
            .catch((e) => logger.error('[IPFSSync] _retryConnection: ', e));
    }

    /**
    * Get the contents of a folder, and add them to the IPFS repo.
    * @return {Promise}
    */
    _readAndSyncFiles() {
        logger.info('[IPFSSync] _readAndSyncFiles');
        this.setState({ synced: false });

        return getFiles(this.state.folder.path)
            .then(this._syncFiles)
            .catch((e) => {
                logger.error('[IPFSSync] _readAndSyncFiles: ', e);
                this._retryConnection();
            });
    }

    /**
    * Get a local node.
    * @return {Promise}
    */
    _getNode() {
        logger.info('[IPFSSync] _getNode');
        return new Promise((resolve, reject) => {
            ipfsCtl.local(IPFS_REPO, {}, (err, node) => {
                if (err) {
                    logger.error('[IPFSSync] _getNode', err);
                    reject(err);
                    return;
                }

                resolve(node);
            });
        });
    }

    /**
    * Initialize the ipfs node if it isn't already.
    * @param {Node} node
    * @return {Promise}
    */
    _initNode(node) {
        logger.info('[IPFSSync] _initNode');
        return new Promise((resolve, reject) => {
            if (node.initialized) {
                resolve(node);
                return;
            }

            node.init({ directory: IPFS_REPO }, (err, res) => {
                if (err) {
                    logger.error('[IPFSSync] _initNode', err);
                    return reject(err);
                }

                return resolve(node);
            });
        });
    }

    /**
    * Attempt to read an existing ipfs config
    * @param {Node} node
    * @return {Promise}
    */
    _getConfig(node) {
        logger.info('[IPFSSync] _getConfig');
        return new Promise((resolve, reject) => {
            node.getConfig('show', (err, configString) => {
                if (err) {
                    logger.error('[IPFSSync] _getConfig', err);
                    return reject(err);
                }

                try {
                    const config = JSON.parse(configString);
                    return resolve(config);
                }
                catch (e) {
                    return reject(e);
                }
            });
        });
    }

    /**
    * Attempt to connet to a running daemon.
    * @param {Node} node
    * @return {Promise}
    */
    _connectToExistingDaemon(node) {
        logger.info('[IPFSSync] _connectToExistingDaemon');
        return new Promise((resolve, reject) => {
            this._getConfig(node)
                .then((config) => {
                    const api = ipfsAPI(config.Addresses.API);
                    return resolve(api);
                })
                .catch(reject);
        });
    }

    /**
     * Attempt to start an ipfs daemon, connecting to a possible running daemon
     * if we fail.
     * @param {Node} node
     * @return {Promise}
     */
    _connectToIPFS(node) {
        logger.info('[IPFSSync] _connectToIPFS');
        return new Promise((resolve, reject) => {
            node.startDaemon((err, daemon) => {
                if (err) {
                    logger.error('[IPFSSync] _connectToIPFS', err);

                    // Connect to an exising daemon if possible
                    return this._connectToExistingDaemon(node)
                        .then(resolve)
                        .catch(reject);
                }

                return resolve(daemon);
            });
        });
    }


    /**
     * Attempt to stop the runninn daemon
     * @param {Node} node
     */
    _stopIPFS(node) {
        logger.info('[IPFSSync] _stopIPFS');
        node.stopDaemon((err, daemon) => {
            if (err) {
                logger.error('[IPFSSync] stopIPFSDaemon', err);
            }
        });
    }

    // Public API ____________________________________________________________
    get state() {
        logger.info('[IPFSSync] get state');
        return this._state;
    }

    /**
    * Update the current state of the sync and dispatch an event.
    * @param  {Object} newState
    * @return {Promise}
    */
    setState(newState) {
        logger.info('[IPFSSync] setState', newState);

        if (this._state &&
            this._state.files &&
            newState.files &&
            (newState.files.length - this._state.files.length) > 0) {
            this.emit(IPC_EVENT_FILES_ADDED);
        }

        this._state = Object.assign({}, this._state, newState);
        this.emit(IPC_EVENT_STATE_CHANGE, this._state);
        return Promise.resolve(this._state);
    }

    /**
     * Start the sync
     * @return {Promise}
     */
    start() {
        logger.info('[IPFSSync] start');
        this.watch();

        return this._getNode()
            .then(this._initNode)
            .then((node) => {
                this.setState({ node });
                return node;
            })
            .then(this._connectToIPFS)
            .then((ipfs) => this.setState({ ipfs, connected: true }))
            .then(() => this._readAndSyncFiles())
            .catch((e) => logger.error('[IPFSSync] startIPFS: ', e));
    }

    /**
     * Quit IPFS
     */
    quit() {
        logger.info('[IPFSSync] quit');

        if (this._state.connected) {
            this._stopIPFS(this._state.node);
        }
    }

    /**
     * Manually trigger the folder watch, called automatically in start().
     */
    watch() {
        logger.info('[IPFSSync] watch');
        fse.ensureDir(this.state.folder.path, (err) => {
            if (err) {
                logger.error('[IPFSSync] watch', err);
                return;
            }
            fs.watch(this.state.folder.path, { recursive: true }, this._readAndSyncFiles);
        });
    }
}

module.exports = IPFSSync;
