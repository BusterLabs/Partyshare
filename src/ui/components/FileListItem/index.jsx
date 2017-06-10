import { h } from 'preact';
import { clipboard, ipcRenderer } from 'electron';
import { isImage } from 'functions';
import {
    IPC_EVENT_NOTIFICATION,
} from '../../../shared/constants';
import IconFile from 'icons/IconFile';
import styles from './FileListItem.css';

const FileListItem = ({ name, path, url }) => (
    <li className={styles.this}>
        <span className={styles.icon}>
            { isImage(path) ?
                <img className={styles.image} src={path} />
            :
                <IconFile />
            }
        </span>
        <p className={styles.name}>
            { name }
        </p>
        { url &&
            <div
              className={styles.copy}
              title="Copy the share link to your clipboard"
              role="button"
              onClick={() => {
                  clipboard.writeText(url, 'selection');
                  ipcRenderer.send(IPC_EVENT_NOTIFICATION, 'Share link copied to your clipboard');
              }}
            >
                copy link
            </div>
        }
    </li>
);

export default FileListItem;
