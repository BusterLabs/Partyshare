import { h } from 'preact';
import styles from './Center.css';

const Center = ({ children }) => (
    <div class={styles.this}>
        {children}
    </div>
);

export default Center;
