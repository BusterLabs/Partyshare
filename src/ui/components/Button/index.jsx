import { h } from 'preact';
import styles from './Button.css';

const Button = ({
    className,
    children,
    type = 'default',
    ...props
}) => (
    <button
        className={`${styles.this} ${styles[type]} ${className ? className : ''}`}
        {...props}
    >
        { children }
    </button>
);

export default Button;
