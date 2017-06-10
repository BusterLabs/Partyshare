import { h } from 'preact';
import styles from './Footer.css';

const Footer = ({ children }) => (
    <footer class={styles.this}>
        {children}
    </footer>
);

export default Footer;
