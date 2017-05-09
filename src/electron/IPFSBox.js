const { IPFS_FOLDER } = require('./constants.js');
const { getFiles, startIPFS } = require('./functions.js');
const { relative, join } = require('path');
const EventEmitter = require('events');
const fs = require('fs');
const fse = require('fs-extra');
const logger = require('electron-log');

const DEFAULTS = {
    boxPath: IPFS_FOLDER,
    autoStart: true,
};

class IPFSBox extends EventEmitter {
    constructor(options) {
        super();

        const {
            boxPath,
            autoStart,
        } = Object.assign(DEFAULTS, options);

        this._bindMethods();
        this._state = {
            files: [],
            connected: false,
            synced: false,
            daemon: null,
            boxPath,
        };

        if (autoStart) {
            this.start();
        }
    }

    // Privates _______________________________________________________________

    _bindMethods() {
        logger.info('[IPFSBox] _bindMethods');
        this._addFilesToIPFS = this._addFilesToIPFS.bind(this);
        this._mapFileData = this._mapFileData.bind(this);
        this._readAndSyncFiles = this._readAndSyncFiles.bind(this);
        this.setState = this.setState.bind(this);
        this.start = this.start.bind(this);
        this.watch = this.watch.bind(this);
        return this;
    }

    _addFilesToIPFS(files) {
        logger.info('[IPFSBox] _addFilesToIPFS');
        files = files.map((file) => {
            return {
                path: relative(this.state.boxPath, file.path),
                content: fs.createReadStream(file.path),
            };
        });
        return this.state.daemon.files.add(files);
    }

    _mapFileData(files) {
        logger.info('[IPFSBox] _mapFileData');

        const promises = files.map((file) => {
            return new Promise((resolve, reject) => {
                fs.stat(join(this.state.boxPath, file.path), (err, stats) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve(Object.assign(file, {
                        path: join(this.state.boxPath, file.path),
                        relativePath: file.path,
                        stats,
                    }));
                });
            });
        });

        return Promise.all(promises);
    }

    _readAndSyncFiles() {
        logger.info('[IPFSBox] _readAndSyncFiles');
        this.setState({ synced: false });

        getFiles(this.state.boxPath)
            .then(this._addFilesToIPFS)
            .then(this._mapFileData)
            .then((files) => this.setState({ files, synced: true }))
            .catch((e) => logger.error('[IPFSBox] _readAndSyncFiles: ', e));
    }

    // Public API ____________________________________________________________
    get state() {
        logger.info('[IPFSBox] get state');
        return this._state;
    }

    setState(newState) {
        logger.info('[IPFSBox] setState', newState);

        if (this._state &&
            this._state.files &&
            newState.files &&
            (newState.files.length - this._state.files.length) > 0) {
            this.emit('files-added');
        }

        this._state = Object.assign({}, this._state, newState);
        this.emit('state-change', this._state);
        return Promise.resolve(this._state);
    }

    start() {
        logger.info('[IPFSBox] start');
        this.watch();

        return startIPFS()
            .then((daemon) => this.setState({ daemon, connected: true }))
            .then(() => this._readAndSyncFiles())
            .catch((e) => logger.error('[IPFSBox] startIPFS: ', e));
    }

    watch() {
        logger.info('[IPFSBox] watch');
        fse.ensureDir(this.state.boxPath, (err) => {
            if (err) {
                logger.error('[IPFSBox] watch', err);
                return;
            }
            fs.watch(this.state.boxPath, this._readAndSyncFiles);
        });
    }
}

module.exports = IPFSBox;
