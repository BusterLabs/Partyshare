const { autoUpdater } = require('electron-updater');
const {
    dialog,
    ipcMain,
 } = require('electron');
const IPFSBox = require('./IPFSBox.js');
const logger = require('electron-log');
const menubar = require('menubar');
const fs = require('fs-extra');
const {
    basename,
    join,
} = require('path');
const {
    __DEV__,
    LIGHT_MENUBAR_ICON_PATH,
    DARK_MENUBAR_ICON_PATH,
    INDEX_PATH,
} = require('./constants');
const {
    IPC_EVENT_REQUEST_STATE,
    IPC_EVENT_SEND_STATE,
    IPC_EVENT_FILES_ADDED,
    IPC_EVENT_NOTIFICATION,
    IPC_EVENT_HIDE_MENU,
    IPC_EVENT_QUIT_APP,
} = require('../shared/constants');

autoUpdater.logger = logger;
autoUpdater.logger.transports.file.level = 'info';

const ipfsBox = new IPFSBox();

const mb = menubar({
    icon: DARK_MENUBAR_ICON_PATH,
    index: INDEX_PATH,
    preloadWindow: true,
    alwaysOnTop: __DEV__,
    width: 350,
    height: 400,
});

mb.on('ready', () => {

    // Menubar flashes, the closes on start without a slight timeout
    setTimeout(() => {
        mb.showWindow();
    }, 1000);

    // Setup highlighted icon
    mb.tray.setPressedImage(LIGHT_MENUBAR_ICON_PATH);

    // Copy files dragged to menu bar into partyshare
    mb.tray.on('drop-files', (event, files) => {

        if (!ipfsBox.state.connected) {
            return;
        }

        files.forEach((filePath) => {
            const fileName = basename(filePath);
            const newPath = join(ipfsBox.state.boxPath, fileName);
            fs.copy(filePath, newPath);
        });
    });


    if (__DEV__) {
        return;
    }

    autoUpdater.checkForUpdates();
});

mb.on('after-create-window', () => {
    mb.window.webContents.send(IPC_EVENT_SEND_STATE, ipfsBox.state);
    mb.window.setMovable(false);

    if (__DEV__) {
        mb.window.openDevTools();
    }

});

mb.on('show', () => {
    mb.window.webContents.send(IPC_EVENT_SEND_STATE, ipfsBox.state);
});

ipfsBox.on('state-change', () => {
    if (!mb.window) {
        logger.error('[ipcMain] No window to send event on');
        return;
    }

    mb.window.webContents.send(IPC_EVENT_SEND_STATE, ipfsBox.state);
});

ipfsBox.on(IPC_EVENT_FILES_ADDED, () => {
    logger.info('[ipfsBox] files-added');
    mb.showWindow();
    mb.window.webContents.send(IPC_EVENT_FILES_ADDED);
});


// Inter Process (Main <-> Render) Communication
// ___________________________________________________________________________

ipcMain.on(IPC_EVENT_REQUEST_STATE, (event) => {
    event.sender.send(IPC_EVENT_SEND_STATE, ipfsBox.state);
});

ipcMain.on(IPC_EVENT_HIDE_MENU, () => {
    mb.hideWindow();
});

ipcMain.on(IPC_EVENT_QUIT_APP, () => {
    mb.app.quit();
});

ipcMain.on(IPC_EVENT_NOTIFICATION, (event, text) => {
    const state = Object.assign(ipfsBox.state, {
        notification: text,
    });
    mb.window.webContents.send(IPC_EVENT_SEND_STATE, state);
    setTimeout(() => {
        const clearedState = Object.assign(ipfsBox.state, {
            notification: false,
        });
        mb.window.webContents.send(IPC_EVENT_SEND_STATE, clearedState);
    }, 3000);
});

// ---------------------------------------------------------------------------
// Auto updates
//
// For details about these events, see their Wiki:
// https://github.com/electron-userland/electron-builder/wiki/Auto-Update#events
// ___________________________________________________________________________

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
