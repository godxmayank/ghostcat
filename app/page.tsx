'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UsernameModal from '@/components/UsernameModal';
import styles from './page.module.css';

export default function JoinScreen() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [roomId, setRoomId] = useState('');

  const handleRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 20);
    setRoomId(value);
  };

  const handleGenerateRoom = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let generated = '';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomId(generated);
  };

  const handleEnterRoom = () => {
    if (roomId.trim().length > 0) {
      router.push(`/room/${encodeURIComponent(roomId)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEnterRoom();
    }
  };

  const handleUsernameComplete = () => {
    setShowModal(false);
  };

  if (showModal) {
    return <UsernameModal onComplete={handleUsernameComplete} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.ghost}>👻</span> GhostChat
          </h1>
          <p className={styles.tagline}>No accounts. No history. No traces.</p>
        </div>

        <div className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="roomId" className={styles.label}>
              Room ID
            </label>
            <input
              id="roomId"
              type="text"
              placeholder="ENTER ROOM ID"
              value={roomId}
              onChange={handleRoomIdChange}
              onKeyPress={handleKeyPress}
              className={styles.input}
              maxLength={20}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>

          <div className={styles.buttonGroup}>
            <button
              onClick={handleEnterRoom}
              disabled={!roomId.trim()}
              className={`${styles.button} ${styles.primaryButton}`}
            >
              Enter Room
            </button>
            <button
              onClick={handleGenerateRoom}
              className={`${styles.button} ${styles.secondaryButton}`}
            >
              Generate Room ID
            </button>
          </div>
        </div>

        <footer className={styles.footer}>
          <p>
            All messages are end-to-end encrypted and vanish when you leave
          </p>
        </footer>
      </div>
    </div>
  );
}
