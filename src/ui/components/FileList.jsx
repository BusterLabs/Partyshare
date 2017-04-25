import { h } from 'preact';
import FileListItem from 'components/FileListItem';
import Center from 'components/Center';
import { GATEWAY_URL } from '../../electron/constants';
import { Button } from 'preact-photon';
import { shell, ipcRenderer } from 'electron';

const FileList = ({ files, synced, boxPath }) => {
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
                      shell.openItem(boxPath);
                      ipcRenderer.send('hide');
                  }}
                >
                    Reveal Folder
                </Button>
            </Center>
        );
    }

    return (
        <ul className="file_list">
            {files.map((file) => <FileListItem file={file} url={`${GATEWAY_URL}/${file.hash}`} />)}
        </ul>
    );
};

export default FileList;
