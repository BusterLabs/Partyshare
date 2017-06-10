import { h } from 'preact';
import styles from './Button.css';

const Button = ({
	class: className,
	children,
	type,
	primary,
	title,
	onClick,
}) => (
	<button
	  	class={`${styles.this} ${styles[type || (primary ? 'primary' : 'default')]} ${className ? className : ''}`}
	  	title={title}
	  	onClick={onClick}
	>
		{ children }
	</button>
);

export default Button;
