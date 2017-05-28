const EventEmitter = require('events');
const fs = require('fs');
const fse = require('fs-extra');
const logger = require('electron-log');
const ipfsCtl = require('ipfsd-ctl');
const ipfsAPI = require('ipfs-api');
const {
    getFiles,
} = require('../functions.js');
const {
    basename,
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

const MAX_DAEMON_RECONNECTS = 5;

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
            daemon: null,
            daemonRetries: 0,
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
        this._addFilesToIPFS = this._addFilesToIPFS.bind(this);
        this._getConfig = this._getConfig.bind(this);
        this._getNode = this._getNode.bind(this);
        this._initNode = this._initNode.bind(this);
        this._readAndSyncFiles = this._readAndSyncFiles.bind(this);
        this._retryDaemonConnection = this._retryDaemonConnection.bind(this);
        this._startDaemon = this._startDaemon.bind(this);
        this.setState = this.setState.bind(this);
        this.start = this.start.bind(this);
        this.quit = this.quit.bind(this);
        this.watch = this.watch.bind(this);
        return this;
    }

    /**
     * Add the whole folder to IPFS, resolving with the new folder
     * hash and a list of files.
     * @param  {Array} files
     * @return {Promise}
     */
    _addFilesToIPFS(files) {
        logger.info('[IPFSSync] _addFilesToIPFS');

        return new Promise((resolve, reject) => {

            if (files.length < 1) {
                resolve({
                    files,
                    folder: this.state.folder,
                });
                return;
            }

            const options = {
                recursive: true,
            };
            this.state.daemon.util.addFromFs(this.state.folder.path, options, (err, result) => {
                if (err) {
                    logger.error('[IPFSSync] _addFilesToIPFS', err);
                    return reject(err);
                }

                const folder = result.find((file) => file.path === this.state.folder.basename);

                if (!folder || !folder.hash) {
                    logger.error('[IPFSSync] _addFilesToIPFS: folder not added', folder);
                    return reject(err);
                }

                // the IPFS api returns a relative path,
                // don't let it overwrite the full path

                delete folder.path;

                return resolve({
                    files,
                    folder: Object.assign({}, this.state.folder, folder),
                });
            });
        });
    }

    /**
     * Retry connecting to the daemon.
     * @return {Promise}
     */
    _retryDaemonConnection() {
        logger.info('[IPFSSync] _retryDaemonConnection');

        if (this.state.daemonRetries > MAX_DAEMON_RECONNECTS) {
            logger.error('[IPFSSync] _retryDaemonConnection: Exceeded max connection retries', this.state.daemonRetries)
            return;
        }

        this.setState({
            daemonRetries: this.state.daemonRetries + 1,
            synced: false,
        });

        this.start()
            .then(() => this.setState({ daemonRetries: 0 }))
            .catch((e) => logger.error('[IPFSSync] _retryDaemonConnection: ', e));
    }

    /**
    * Get the contents of a folder, and add them to the IPFS repo.
    * @return {Promise}
    */
    _readAndSyncFiles() {
        logger.info('[IPFSSync] _readAndSyncFiles');
        this.setState({ synced: false });


        return getFiles(this.state.folder.path)
            .then(this._addFilesToIPFS)
            .then(({ files, folder }) => this.setState({ files, folder, synced: true }))
            .catch((e) => {
                logger.error('[IPFSSync] _readAndSyncFiles: ', e);
                this._retryDaemonConnection();
            });
    }

    /**
    * Get a local node.
    * @return {Promise}
    */
    _getNode() {
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
     * Attempt to start a daemon, connecting to a possible running daemon
     * if we fail.
     * @param {Node} node
     * @return {Promise}
     */
    _startDaemon(node) {
        return new Promise((resolve, reject) => {
            node.startDaemon((err, daemon) => {
                if (err) {
                    logger.error('[IPFSSync] startIPFSDaemon', err);

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
     * Attempt to stop daemon
     * @param {Node} node
     */
    _stopDaemon(node) {
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
                .then(this._startDaemon)
                .then((daemon) => this.setState({ daemon, connected: true }))
                .then(() => this._readAndSyncFiles())
                .catch((e) => logger.error('[IPFSSync] startIPFS: ', e));
    }

    /**
     * Quit IPFS
     */
    quit() {
        logger.info('[IPFSSync] quit');

        if (this._state.connected) {
            this._stopDaemon(this._state.node);
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
            fs.watch(this.state.folder.path, this._readAndSyncFiles);
        });
    }
}

module.exports = IPFSSync;
