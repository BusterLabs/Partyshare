import { h } from 'preact';
import styles from './Footer.css';

const Footer = ({
    children,
    ...props
}) => (
    <footer class={styles.this} {...props}>
        {children}
    </footer>
);

export default Footer;
