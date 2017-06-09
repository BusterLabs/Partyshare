import { h } from 'preact';
import FileListItem from 'components/FileListItem';
import Center from 'components/Center';
import { GATEWAY_URL } from '../../../electron/constants';
import { Button } from 'preact-photon';
import { shell, ipcRenderer } from 'electron';
import {
    IPC_EVENT_HIDE_MENU,
} from '../../../shared/constants';
import {
    basename,
    relative,
} from 'path';

import styles from './FileList.css';

const FileList = ({ files, synced, folder }) => {
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
        <ul className={styles.this}>
            {files.map((file) => <FileListItem
              name={basename(file.path)}
              path={file.path}
              url={`${GATEWAY_URL}/${folder.hash}/${relative(folder.path, file.path)}`} />
            )}
        </ul>
    );
};

export default FileList;
