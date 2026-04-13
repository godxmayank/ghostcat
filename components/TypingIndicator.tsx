'use client';

import styles from './TypingIndicator.module.css';

interface TypingIndicatorProps {
  usernames: string[];
}

export default function TypingIndicator({ usernames }: TypingIndicatorProps) {
  if (usernames.length === 0) return null;

  const text =
    usernames.length === 1
      ? `${usernames[0]} is typing...`
      : `${usernames.join(', ')} are typing...`;

  return (
    <div className={styles.container}>
      <div className={styles.typing}>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
      </div>
      <span className={styles.text}>{text}</span>
    </div>
  );
}
