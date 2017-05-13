import { h } from 'preact';
import { shell, clipboard, ipcRenderer } from 'electron';
import { basename, extname } from 'path';
import { fireEvent, isImage } from 'functions';
import {
    IPC_EVENT_NOTIFICATION,
    IPC_EVENT_HIDE_MENU,
} from '../../shared/constants';


const FileListItem = ({ file, url }) => (
    <li className="file_list_item">
        <span className="file_list_item--icon">
            { isImage(file.path) ?
                <img className="file_list_item--image" src={file.path} />
            :
                <span className="icon icon-doc-text" />
            }
        </span>
        <p className="file_list_item--name">
            { `${basename(file.relativePath, extname(file.relativePath))}${extname(file.relativePath).toLowerCase()}` }
        </p>
        { file.hash && [
            <div
              className="file_list_item--button"
              title="Copy the share link to your clipboard"
              role="button"
              onClick={() => {
                  clipboard.writeText(url, 'selection');
                  ipcRenderer.send(IPC_EVENT_NOTIFICATION, 'Share link copied to your clipboard');
                  fireEvent({
                      category: 'ui',
                      action: 'copy_link',
                  });
              }}
            >
                <span class="icon icon-link" />
            </div>,
            <div
              className="file_list_item--button"
              title="Open the share link in your browser"
              role="button"
              onClick={() => {
                  shell.openExternal(url);
                  ipcRenderer.send(IPC_EVENT_HIDE_MENU);
                  fireEvent({
                      category: 'ui',
                      action: 'open_link',
                  });
              }}
            >
                <span class="icon icon-forward" />
            </div>,
        ]}
    </li>
);

export default FileListItem;
