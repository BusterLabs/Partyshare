import { h } from 'preact';
import Button from 'components/Button';
import Center from 'components/Center';
import FileListItem from 'components/FileListItem';
import { GATEWAY_URL } from '../../../electron/constants';
import { shell, ipcRenderer } from 'electron';
import {
    IPC_EVENT_HIDE_MENU,
} from '../../../shared/constants';

import styles from './FileList.css';

const FileList = ({
    files,
    synced,
    folder,
    ...props
}) => {
    if (files.length < 1 && !synced) {
        return (
            <Center>Syncing…</Center>
        );
    }

    if (files.length < 1) {
        return (
            <Center>
                <p>Drag a file into your Partyshare folder to begin</p>
                <Button
                    onClick={() => {
                        shell.openItem(folder.path);
                        ipcRenderer.send(IPC_EVENT_HIDE_MENU);
                    }}
                >
                    Reveal Folder
                </Button>
            </Center>
        );
    }

    files = files.sort((a, b) => new Date(b.stats.ctime) - new Date(a.stats.ctime));

    return (
        <ul className={styles.this} {...props}>
            {files.map((file) => <FileListItem
                name={file.name}
                path={file.path}
                url={`${GATEWAY_URL}/${file.urlPath}`} />
            )}
        </ul>
    );
};

export default FileList;
