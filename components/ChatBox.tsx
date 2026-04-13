'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import styles from './ChatBox.module.css';

export interface Message {
  id: string;
  text: string;
  username?: string;
  isOwn: boolean;
  isSystem: boolean;
  timestamp: number;
  autoDeleteTime?: number;
}

interface ChatBoxProps {
  messages: Message[];
  typingUsers: string[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onTyping: () => void;
  isConnected: boolean;
  autoDeleteEnabled: boolean;
  onAutoDeleteToggle: (enabled: boolean) => void;
  deleteTimeOption: number;
  onDeleteTimeChange: (seconds: number) => void;
}

const DELETE_OPTIONS = [
  { label: 'Never', value: 0 },
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
];

export default function ChatBox({
  messages,
  typingUsers,
  inputValue,
  onInputChange,
  onSendMessage,
  onTyping,
  isConnected,
  autoDeleteEnabled,
  onAutoDeleteToggle,
  deleteTimeOption,
  onDeleteTimeChange,
}: ChatBoxProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers, scrollToBottom]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        onSendMessage();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value.slice(0, 300));
    onTyping();
  };

  return (
    <div className={styles.container}>
      {/* Messages Area */}
      <div className={styles.messagesArea}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💬</div>
            <p className={styles.emptyText}>No messages yet</p>
            <p className={styles.emptySubtext}>Start a conversation!</p>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                id={msg.id}
                text={msg.text}
                username={msg.username}
                isOwn={msg.isOwn}
                isSystem={msg.isSystem}
                timestamp={msg.timestamp}
                autoDeleteTime={msg.autoDeleteTime}
              />
            ))}
            {typingUsers.length > 0 && <TypingIndicator usernames={typingUsers} />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        {/* Settings Toggle */}
        <div className={styles.settingsToggle}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={styles.settingsBtn}
            title="Message settings"
          >
            ⚙️
          </button>
        </div>

        {/* Auto-delete Settings */}
        {showSettings && (
          <div className={styles.settings}>
            <label className={styles.settingRow}>
              <input
                type="checkbox"
                checked={autoDeleteEnabled}
                onChange={(e) => onAutoDeleteToggle(e.target.checked)}
              />
              <span>Auto-delete messages</span>
            </label>
            {autoDeleteEnabled && (
              <div className={styles.settingRow}>
                <label htmlFor="deleteTime">Delete after:</label>
                <select
                  id="deleteTime"
                  value={deleteTimeOption}
                  onChange={(e) => onDeleteTimeChange(Number(e.target.value))}
                  className={styles.select}
                >
                  {DELETE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Input Bar */}
        <div className={styles.inputBar}>
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? 'Type message... (Shift+Enter for new line)' : 'Waiting for peer...'}
            disabled={!isConnected}
            maxLength={300}
            className={styles.input}
            rows={1}
          />
          <button
            onClick={onSendMessage}
            disabled={!inputValue.trim() || !isConnected}
            className={styles.sendBtn}
            title="Send (Enter)"
          >
            Send
          </button>
        </div>

        {/* Character Counter */}
        <div className={styles.footer}>
          <span className={styles.charCount}>
            {inputValue.length}/300
          </span>
          {!isConnected && (
            <span className={styles.status}>⏳ Waiting for peer...</span>
          )}
        </div>
      </div>
    </div>
  );
}
