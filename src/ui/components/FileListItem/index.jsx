import { h } from 'preact';
import { clipboard, ipcRenderer } from 'electron';
import { isImage } from 'functions';
import {
    IPC_EVENT_NOTIFICATION,
} from '../../../shared/constants';
import IconFile from 'icons/IconFile';
import styles from './FileListItem.css';

const FileListItem = ({
    name,
    path,
    url,
    ...props
}) => (
    <li className={styles.this} {...props}>
        <span className={styles.icon}>
            { isImage(path) ?
                <img className={styles.image} src={path} />
                :
                <IconFile className={styles.file} />
            }
        </span>
        <p className={styles.name}>
            { name }
        </p>
        { url &&
            <div
                className={styles.copy_hit_area}
                title="Copy link to your clipboard"
                role="button"
                onClick={() => {
                    clipboard.writeText(url);
                    ipcRenderer.send(IPC_EVENT_NOTIFICATION, 'Link copied to your clipboard');
                }}
            >
                <span className={styles.copy_button}>
                    Copy Link
                </span>
            </div>
        }
    </li>
);

export default FileListItem;
