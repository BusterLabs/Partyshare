const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');
const { ipcMain } = require('electron');
const IPFSBox = require('./IPFSBox.js');
const logger = require('electron-log');
const menubar = require('menubar');
const { __DEV__, ICON_PATH, INDEX_PATH } = require('./constants');

autoUpdater.logger = logger;
autoUpdater.logger.transports.file.level = 'info';

const ipfsBox = new IPFSBox();

const mb = menubar({
    icon: ICON_PATH,
    index: INDEX_PATH,
    preloadWindow: true,
    alwaysOnTop: __DEV__,
    width: 350,
    height: 400,
});

mb.on('ready', () => {
    if (__DEV__) {
        mb.showWindow();
        return;
    }

    autoUpdater.checkForUpdates();
});

mb.on('after-create-window', () => {
    mb.window.webContents.send('send-state', ipfsBox.state);

    if (__DEV__) {
        mb.window.openDevTools();
    }
});

mb.on('show', () => {
    mb.window.webContents.send('send-state', ipfsBox.state);
});

ipfsBox.on('state-change', () => {
    if (!mb.window) {
        logger.error('[ipcMain] No window to send event on');
        return;
    }

    mb.window.webContents.send('send-state', ipfsBox.state);
});


// Inter Process (Main <-> Render) Communication
// ___________________________________________________________________________

ipcMain.on('request-state', (event) => {
    event.sender.send('send-state', ipfsBox.state);
});

ipcMain.on('hide', () => {
    mb.hideWindow();
});

ipcMain.on('quit', () => {
    mb.app.quit();
});

ipcMain.on('notification', (event, text) => {
    const state = Object.assign(ipfsBox.state, {
        notification: text,
    });
    mb.window.webContents.send('send-state', state);
    setTimeout(() => {
        const clearedState = Object.assign(ipfsBox.state, {
            notification: false,
        });
        mb.window.webContents.send('send-state', clearedState);
    }, 3000);
});

// ---------------------------------------------------------------------------
// Auto updates
//
// For details about these events, see their Wiki:
// https://github.com/electron-userland/electron-builder/wiki/Auto-Update#events
// ___________________________________________________________________________

autoUpdater.on('checking-for-update', () => {
    logger.info('[autoUpdate] Checking for update...');
});
autoUpdater.on('update-available', (ev, info) => {
    logger.info('[autoUpdate] Update available.');
});
autoUpdater.on('update-not-available', (ev, info) => {
    logger.info('[autoUpdate] Update not available.');
});
autoUpdater.on('error', (ev, err) => {
    logger.info('[autoUpdate] Error in auto-updater.', err);
});
autoUpdater.on('download-progress', (ev, progressObj) => {
    logger.info('[autoUpdate] Download progress...');
});
autoUpdater.on('update-downloaded', (ev, info) => {
    logger.info('[autoUpdate] Update downloaded');
});
autoUpdater.on('update-downloaded', (ev, info) => {
    logger.info('[autoUpdate] Notifying user of update');
    dialog.showMessageBox({
        type: 'info',
        title: 'Update available',
        message: 'An update for Partyshare is available, ok to restart?',
        buttons: ['Restart', 'Ignore'],
    }, (buttonIndex) => {
        if (buttonIndex === 0) {
            logger.info('[autoUpdate] Quitting and installing....');
            autoUpdater.quitAndInstall();
        }
    });
});
