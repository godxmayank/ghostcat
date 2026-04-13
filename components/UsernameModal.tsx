'use client';

import { useState, useEffect } from 'react';
import styles from './UsernameModal.module.css';
import { getUsername, setUsername } from '@/lib/user';

interface UsernameModalProps {
  onComplete: () => void;
}

export default function UsernameModal({ onComplete }: UsernameModalProps) {
  const [username, setUsernameInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Pre-fill with existing username if available
    const existing = getUsername();
    if (existing) {
      setUsernameInput(existing);
    }
  }, []);

  const generateRandomUsername = () => {
    setIsGenerating(true);
    const adjectives = ['Swift', 'Bright', 'Calm', 'Eager', 'Keen', 'Happy', 'Quiet', 'Bold'];
    const nouns = ['Tiger', 'Eagle', 'Wolf', 'Fox', 'Bear', 'Raven', 'Owl', 'Hawk'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 1000);
    const generated = `${adj}${noun}${num}`;
    setUsernameInput(generated);
    setTimeout(() => setIsGenerating(false), 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed) {
      setUsername(trimmed);
      onComplete();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Choose Your Name</h2>
          <p className={styles.subtitle}>This stays on your device only</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsernameInput(e.target.value.slice(0, 30))}
              placeholder="Enter username..."
              className={styles.input}
              autoFocus
              maxLength={30}
              onKeyPress={handleKeyPress}
            />
            <button
              type="button"
              onClick={generateRandomUsername}
              className={styles.generateBtn}
              disabled={isGenerating}
            >
              {isGenerating ? '...' : '🎲'}
            </button>
          </div>

          <button
            type="submit"
            disabled={!username.trim()}
            className={styles.submitBtn}
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
