import { h } from 'preact';
import styles from './Center.css';

const Center = ({
    children,
    ...props
}) => (
    <div className={styles.this} {...props}>
        {children}
    </div>
);

export default Center;
