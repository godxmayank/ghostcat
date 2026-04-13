'use client';

import { useState } from 'react';
import styles from './UserBar.module.css';
import { getUsername, setUsername, getAvatarColor, getInitials } from '@/lib/user';

interface UserBarProps {
  onlineCount: number;
  roomId: string;
}

export default function UserBar({ onlineCount, roomId }: UserBarProps) {
  const [username, setUsernameState] = useState(getUsername());
  const [isEditing, setIsEditing] = useState(false);
  const [tempUsername, setTempUsername] = useState(username);
  const [copied, setCopied] = useState(false);

  const handleSaveUsername = () => {
    if (tempUsername.trim()) {
      setUsername(tempUsername.trim());
      setUsernameState(tempUsername.trim());
      setIsEditing(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setTempUsername(username);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleCopyRoom = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const avatarColor = getAvatarColor(username);
  const initials = getInitials(username);

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        {isEditing ? (
          <div className={styles.editForm}>
            <input
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              placeholder="Enter username"
              maxLength={30}
              autoFocus
              className={styles.input}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveUsername();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <button onClick={handleSaveUsername} className={styles.saveBtn}>
              Save
            </button>
            <button onClick={handleCancel} className={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        ) : (
          <div className={styles.userInfo}>
            <div className={styles.avatar} style={{ backgroundColor: avatarColor }}>
              {initials}
            </div>
            <div className={styles.details}>
              <div className={styles.username}>You • {username}</div>
              <button onClick={handleEditClick} className={styles.editBtn}>
                Edit
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.center}>
        <div className={styles.roomId}>
          <span className={styles.label}>Room:</span>
          <span className={styles.id}>{roomId}</span>
          <button
            onClick={handleCopyRoom}
            className={styles.copyBtn}
            title="Copy room ID"
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.status}>
          <span className={styles.indicator}>●</span>
          <span className={styles.count}>{onlineCount} online</span>
        </div>
      </div>
    </div>
  );
}
