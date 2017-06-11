import 'babel-polyfill';
import { h, Component, render } from 'preact';
import Button from 'components/Button';
import Center from 'components/Center';
import FileList from 'components/FileList';
import Footer from 'components/Footer';
import Header from 'components/Header';
import Notification from 'components/Notification';
import Title from 'components/Title';
import IconCog from 'icons/IconCog';
import IconFolder from 'icons/IconFolder';
import { basename, join } from 'path';
import { ipcRenderer, shell, remote } from 'electron';
const { Menu, MenuItem } = remote;
import fs from 'fs-extra';
import filesize from 'file-size';
import {
    IPC_EVENT_REQUEST_STATE,
    IPC_EVENT_SEND_STATE,
    IPC_EVENT_HIDE_MENU,
    IPC_EVENT_QUIT_APP,
    URL_BUG,
    URL_HACK,
    URL_TWEET,
} from '../shared/constants';
import { version } from '../../package.json';

import styles from './index.css';

class Application extends Component {

    constructor(props) {
        super(props);

        this.state = {
            files: [],
            connected: false,
            synced: false,
            daemon: null,
            folder: null,
        };

        this.onIpcChange = this.onIpcChange.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.openSettingsMenu = this.openSettingsMenu.bind(this);
        this.openFolder = this.openFolder.bind(this);
    }

    componentDidMount() {
        ipcRenderer.on(IPC_EVENT_SEND_STATE, this.onIpcChange);
        ipcRenderer.send(IPC_EVENT_REQUEST_STATE);
    }

    componentWillUnmount() {
        ipcRenderer.removeListener(IPC_EVENT_SEND_STATE, this.onIpcChange);
    }

    onIpcChange(event, newState) {
        this.setState(newState);
    }

    onDrop(e) {
        e.preventDefault();
        const {
            folder,
        } = this.state;

        Array.from(e.dataTransfer.files).forEach((file) => {
            const fileName = basename(file.path);
            const newPath = join(folder, fileName);
            fs.copy(file.path, newPath, () => {});
        });
    }

    openSettingsMenu() {
        const menu = new Menu();
        menu.append(new MenuItem({ label: `Version ${version}`, enabled: false }));
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({ label: 'Spread the Word', click: () => shell.openExternal(URL_TWEET) }));
        menu.append(new MenuItem({ label: 'Contribute to Partyshare', click: () => shell.openExternal(URL_HACK) }));
        menu.append(new MenuItem({ label: 'Report a Bug', click: () => shell.openExternal(URL_BUG) }));
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({ label: 'Quit Partyshare', click: () => ipcRenderer.send(IPC_EVENT_QUIT_APP) }));
        menu.popup(remote.getCurrentWindow());
    }

    openFolder() {
        ipcRenderer.send(IPC_EVENT_HIDE_MENU);
        shell.openItem(this.state.folder.path);
    }

    render(props, state) {
        const {
            folder,
            connected,
            files,
            notification,
            synced,
        } = this.state;

        const totalSize = filesize(files.reduce((total, file) => total + file.stats.size, 0), { fixed: 1 }).human('si');

        return (
            <div class={styles.this}
              onDragOver={(e) => e.preventDefault()}
              onDrop={this.onDrop}
            >
                <Header>
                    <Button
                      title="Quit Partyshare"
                      onClick={this.openSettingsMenu}
                    >
                        <IconCog />
                    </Button>
                    <Title>
                        {connected && synced && `Sharing ${files.length} files (${totalSize})`}
                        {connected && !synced && 'Syncing…'}
                    </Title>
                    <Button
                      title="Open folder"
                      onClick={this.openFolder}
                    >
                        <IconFolder />
                    </Button>
                </Header>

                <div class={styles.content}>
                    { notification ? <Notification>{notification}</Notification> : null }
                    { connected ? <FileList files={files} synced={synced} folder={folder} /> : <Center>Connecting…</Center>}
                    { files && files.length < 1 && <Footer>* Heads up, files added to IPFS can‘t be deleted</Footer>}
                </div>
            </div>
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
    render(<Application />, document.body);
});
