import { h } from 'preact';
import styles from './Notification.css';

const Notification = ({ children }) => (
    <div className={styles.this}>
        {children}
    </div>
);

export default Notification;
