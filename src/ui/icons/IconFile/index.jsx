import { h } from 'preact';
import styles from './IconFile.css';

const IconFile = ({
    className,
    children,
    filled = false,
    ...props
}) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      class={`${styles.this} ${className ? className : ''}`}
      {...props}
    >
        { filled ?
            <path d="M20 9v82h60V29H62a2 2 0 0 1-2-2V9H20zm44 2v14h14L64 11zM30 41h32a2 2 0 1 1 0 4H30a2 2 0 1 1 0-4zm0 16h40a2 2 0 1 1 0 4H30a2 2 0 1 1 0-4zm0 16h40a2 2 0 1 1 0 4H30a2 2 0 1 1 0-4z" overflow="visible" />
        :
            <path style="text-indent:0;text-transform:none;block-progression:tb" d="M20 7c-1.075 0-2 1.1-2 2v82c0 1.047.953 2 2 2h60c1.047 0 2-.953 2-2V27c0-.532-.215-1.063-.594-1.437l-18-18A2.024 2.024 0 0 0 62 7H20zm2 4h38v16c0 1.047.953 2 2 2h16v60H22V11zm42 2.813L75.188 25H64V13.813zM30 41a2 2 0 1 0 0 4h32a2 2 0 1 0 0-4H30zm0 16a2 2 0 1 0 0 4h40a2 2 0 1 0 0-4H30zm0 16a2 2 0 1 0 0 4h40a2 2 0 1 0 0-4H30z" overflow="visible" />
        }
    </svg>
);

export default IconFile;
