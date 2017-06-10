import { h } from 'preact';
import styles from './IconFile.css';

const IconFile = ({
	class: className,
	children,
}) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      class={`${styles.this} ${className ? className : ''}`}
    >
        <path style="text-indent:0;text-transform:none;block-progression:tb" d="M28 7c-5.505 0-10 4.495-10 10v66c0 5.505 4.495 10 10 10h44c5.505 0 10-4.495 10-10V17c0-5.505-4.495-10-10-10H28zm0 4h44c3.359 0 6 2.641 6 6v66c0 3.359-2.641 6-6 6H28c-3.359 0-6-2.641-6-6V17c0-3.359 2.641-6 6-6zm3 17a2 2 0 1 0 0 4h38a2 2 0 1 0 0-4H31zm0 20a2 2 0 1 0 0 4h38a2 2 0 1 0 0-4H31zm0 20a2 2 0 1 0 0 4h38a2 2 0 1 0 0-4H31z" overflow="visible" />
    </svg>
);

export default IconFile;
