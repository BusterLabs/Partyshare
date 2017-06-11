import { h } from 'preact';
import styles from './Header.css';

const Header = ({
    children,
    ...props
}) => (
    <header class={styles.this} {...props}>
        {children}
    </header>
);

export default Header;
