import { h } from 'preact';
import styles from './Header.css';

const Header = ({ children }) => (
    <header class={styles.this}>
        {children}
    </header>
);

export default Header;
