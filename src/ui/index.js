import 'babel-polyfill';
import { h, Component, render } from 'preact';
import { Header, Title, Button } from 'preact-photon';
import FileList from 'components/FileList';
import Center from 'components/Center';
import Notification from 'components/Notification';
import { basename, join } from 'path';
import { ipcRenderer, shell } from 'electron';
import fs from 'fs-extra';
import filesize from 'file-size';
import { fireEvent } from 'functions';

class Application extends Component {

    constructor(props) {
        super(props);

        this.state = {
            files: [],
            connected: false,
            synced: false,
            daemon: null,
            boxPath: null,
        };

        this.onIpcChange = this.onIpcChange.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.openFolder = this.openFolder.bind(this);
    }

    componentDidMount() {
        ipcRenderer.on('send-state', this.onIpcChange);
        ipcRenderer.on('files-added', (event) => {
            fireEvent({
                category: 'ipc',
                action: 'files_added',
            });
        });
        ipcRenderer.send('request-state');
    }

    componentWillUnmount() {
        ipcRenderer.removeListener('send-state', this.onIpcChange);
    }

    onIpcChange(event, newState) {
        this.setState(newState);
    }

    onDrop(e) {
        e.preventDefault();
        const {
            boxPath,
        } = this.state;

        Array.from(e.dataTransfer.files).forEach((file) => {
            const fileName = basename(file.path);
            const newPath = join(boxPath, fileName);
            fs.copy(file.path, newPath, () => {});
        });

        fireEvent({
            category: 'ui',
            action: 'drop_files',
        });
    }

    openFolder() {
        ipcRenderer.send('hide');
        shell.openItem(this.state.boxPath);
        fireEvent({
            category: 'ui',
            action: 'open_folder',
        });
    }

    render(props, state) {
        const {
            boxPath,
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
                      onClick={() => ipcRenderer.send('quit')}
                    />
                    <Title>
                        {connected && synced && `Sharing ${files.length} files (${totalSize})`}
                        {connected && !synced && 'Syncing…'}
                    </Title>
                    <Button icon="folder"
                      onClick={this.openFolder}
                    />
                </Header>

                <div class="window-content">
                    <div class="pane-group">
                        <div class="pane">
                            { notification ? <Notification>{notification}</Notification> : null }
                            { connected ? <FileList files={files} synced={synced} boxPath={boxPath} /> : <Center>Connecting…</Center>}
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
