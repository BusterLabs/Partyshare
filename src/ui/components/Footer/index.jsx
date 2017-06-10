import { h } from 'preact';

import styles from './Footer.css';

const Footer = (children) => (
    <div class={styles.this}>
        {children}
    </div>
);

export default Footer;
