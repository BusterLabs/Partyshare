import { h } from 'preact';
import styles from './Notification.css';

const Notification = ({
    children,
    ...props
}) => (
    <div className={styles.this} {...props}>
        {children}
    </div>
);

export default Notification;
