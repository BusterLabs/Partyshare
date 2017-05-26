import 'babel-polyfill';
import { h, Component, render } from 'preact';
import { Header, Title, Button } from 'preact-photon';
import FileList from 'components/FileList';
import Center from 'components/Center';
import Footer from 'components/Footer';
import Notification from 'components/Notification';
import { basename, join } from 'path';
import { ipcRenderer, shell } from 'electron';
import fs from 'fs-extra';
import filesize from 'file-size';
const {
    IPC_EVENT_REQUEST_STATE,
    IPC_EVENT_SEND_STATE,
    IPC_EVENT_HIDE_MENU,
    IPC_EVENT_QUIT_APP,
} = require('../shared/constants');

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
            <div class="window"
              onDragOver={(e) => e.preventDefault()}
              onDrop={this.onDrop}
            >
                <Header>
                    <Button icon="cancel-circled"
                      title="Quit Partyshare"
                      onClick={() => ipcRenderer.send(IPC_EVENT_QUIT_APP)}
                    />
                    <Title>
                        {connected && synced && `Sharing ${files.length} files (${totalSize})`}
                        {connected && !synced && 'Syncing…'}
                    </Title>
                    <Button icon="folder"
                      title="Open folder"
                      onClick={this.openFolder}
                    />
                </Header>

                <div class="window-content">
                    <div class="pane-group">
                        <div class="pane">
                            { notification ? <Notification>{notification}</Notification> : null }
                            { connected ? <FileList files={files} synced={synced} folder={folder} /> : <Center>Connecting…</Center>}
                            { files && files.length < 1 && <Footer>* Heads up, files added to IPFS can't be deleted later</Footer>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
    render(<Application />, document.body);
});
