import { h } from 'preact';
import styles from './Title.css';

const Title = ({
    children,
    ...props
}) => (
    <h1 class={styles.this} {...props}>
        {children}
    </h1>
);

export default Title;
