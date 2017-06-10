import { h } from 'preact';
import styles from './Title.css';

const Title = ({ children }) => (
    <h1 class={styles.this}>
        {children}
    </h1>
);

export default Title;
