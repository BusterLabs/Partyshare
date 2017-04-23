import { h } from 'preact';
import FileListItem from 'components/FileListItem';
import Center from 'components/Center';
import { GATEWAY_URL } from '../../electron/constants';

const FileList = ({ files, synced, clipboard }) => {
    if (files.length < 1) {
        return (
            <Center>
                { synced ? 'No files' : 'Syncing…' }
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
