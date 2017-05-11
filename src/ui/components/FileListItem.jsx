import { h } from 'preact';
import { shell, clipboard, ipcRenderer } from 'electron';
import { basename, extname } from 'path';
import { fireEvent, isImage } from 'functions';


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
              onClick={() => {
                  clipboard.writeText(url, 'selection');
                  ipcRenderer.send('notification', 'Link copied!');
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
              onClick={() => {
                  shell.openExternal(url);
                  ipcRenderer.send('hide');
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
