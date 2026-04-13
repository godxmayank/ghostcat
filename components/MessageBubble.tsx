'use client';

import { useEffect, useState } from 'react';
import styles from './MessageBubble.module.css';
import { getInitials, getAvatarColor } from '@/lib/user';

interface MessageBubbleProps {
  id: string;
  text: string;
  username?: string;
  isOwn: boolean;
  isSystem: boolean;
  timestamp: number;
  autoDeleteTime?: number; // in seconds
}

export default function MessageBubble({
  id,
  text,
  username = 'Anonymous',
  isOwn,
  isSystem,
  timestamp,
  autoDeleteTime = 0,
}: MessageBubbleProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(autoDeleteTime || null);

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  useEffect(() => {
    if (!autoDeleteTime || autoDeleteTime <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev && prev <= 1) {
          setIsVisible(false);
          return 0;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoDeleteTime]);

  if (isSystem) {
    return (
      <div className={styles.systemMessage}>
        <div className={styles.systemText}>{text}</div>
      </div>
    );
  }

  if (!isVisible) return null;

  const avatarColor = getAvatarColor(username);
  const initials = getInitials(username);

  return (
    <div
      className={`${styles.bubble} ${isOwn ? styles.own : styles.other}`}
      data-message-id={id}
    >
      {!isOwn && (
        <div className={styles.avatar} style={{ backgroundColor: avatarColor }}>
          {initials}
        </div>
      )}

      <div className={styles.content}>
        {!isOwn && <div className={styles.username}>{username}</div>}

        <div className={styles.messageBox}>
          <p className={styles.messageText}>{text}</p>
          {timeLeft !== null && (
            <span className={styles.deleteTimer}>
              {timeLeft}s
            </span>
          )}
        </div>

        <div className={styles.timestamp}>{formatTime(timestamp)}</div>
      </div>
    </div>
  );
}
