'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import PusherJS from 'pusher-js';
import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
} from '@/lib/crypto';
import styles from './page.module.css';

export default function ChatScreen() {
  const params = useParams();
  const roomId = decodeURIComponent(params.roomId);

  // Key exchange state
  const myKeyPairRef = useRef(null);
  const myPublicKeyB64Ref = useRef(null);
  const peerIdRef = useRef(null);
  const sharedKeyRef = useRef(null);

  // UI state
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [peerCount, setPeerCount] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);

  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);
  const pusherRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Pusher and generate keys
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Check required env vars
        if (
          !process.env.NEXT_PUBLIC_PUSHER_KEY ||
          !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
        ) {
          console.error('Missing Pusher environment variables');
          setMessages([
            {
              id: 'error-init',
              text: 'Configuration error: Pusher credentials missing',
              mine: false,
              isSystem: true,
            },
          ]);
          return;
        }

        // Initialize Pusher
        pusherRef.current = new PusherJS(
          process.env.NEXT_PUBLIC_PUSHER_KEY,
          {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            forceTLS: true,
          }
        );

        // Generate ECDH key pair
        const keyPair = await generateKeyPair();
        myKeyPairRef.current = keyPair;
        myPublicKeyB64Ref.current = await exportPublicKey(keyPair.publicKey);

        // Subscribe to room channel
        channelRef.current = pusherRef.current.subscribe(roomId);

        // Bind Pusher events
        channelRef.current.bind('peer-joined', async (payload) => {
          handlePeerJoined(payload);
        });

        channelRef.current.bind('share-key', async (payload) => {
          handleShareKey(payload);
        });

        channelRef.current.bind('message', async (payload) => {
          handleMessage(payload);
        });

        channelRef.current.bind('peer-left', async (payload) => {
          handlePeerLeft(payload);
        });

        // Notify others that we joined
        await signalEvent('peer-joined', {
          publicKey: myPublicKeyB64Ref.current,
        });

        setIsConnecting(false);
        setPeerCount(1); // self
      } catch (error) {
        console.error('Chat initialization error:', error);
        setMessages([
          {
            id: 'error-init-detail',
            text: 'Failed to initialize chat',
            mine: false,
            isSystem: true,
          },
        ]);
        setIsConnecting(false);
      }
    };

    initializeChat();

    // Cleanup on unmount
    return () => {
      // Clear sensitive state
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusherRef.current?.unsubscribe(roomId);
      }
      myKeyPairRef.current = null;
      myPublicKeyB64Ref.current = null;
      peerIdRef.current = null;
      sharedKeyRef.current = null;
      setMessages([]);
    };
  }, [roomId]);

  // Handle beforeunload to signal peer-left
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (peerIdRef.current) {
        try {
          await signalEvent('peer-left', {});
        } catch (error) {
          // Best effort, page is unloading
          console.error('Error sending peer-left:', error);
        }
      }
      // Clear messages on page unload
      setMessages([]);
      sharedKeyRef.current = null;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Pusher event handlers
  const handlePeerJoined = async (payload) => {
    const { data } = payload;
    const { publicKey } = data;

    if (!publicKey) return;

    // First peer to join (not us)
    if (!peerIdRef.current) {
      peerIdRef.current = Math.random().toString(36).substring(2, 11);
      setPeerCount(2);

      // Import their public key and derive shared key
      try {
        const theirPublicKey = await importPublicKey(publicKey);
        const sharedKey = await deriveSharedKey(
          myKeyPairRef.current.privateKey,
          theirPublicKey
        );
        sharedKeyRef.current = sharedKey;

        // Share our public key back
        await signalEvent('share-key', {
          publicKey: myPublicKeyB64Ref.current,
        });

        // System message
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36),
            text: 'User joined',
            mine: false,
            isSystem: true,
          },
        ]);
      } catch (error) {
        console.error('Error deriving shared key:', error);
      }
    }
  };

  const handleShareKey = async (payload) => {
    const { data } = payload;
    const { publicKey } = data;

    if (!publicKey) return;

    // If we already have a shared key, ignore (already established)
    if (sharedKeyRef.current) return;

    try {
      const theirPublicKey = await importPublicKey(publicKey);
      const sharedKey = await deriveSharedKey(
        myKeyPairRef.current.privateKey,
        theirPublicKey
      );
      sharedKeyRef.current = sharedKey;

      if (!peerIdRef.current) {
        peerIdRef.current = Math.random().toString(36).substring(2, 11);
        setPeerCount(2);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36),
          text: 'User joined',
          mine: false,
          isSystem: true,
        },
      ]);
    } catch (error) {
      console.error('Error importing peer key:', error);
    }
  };

  const handleMessage = async (payload) => {
    const { data } = payload;
    const { ciphertext, iv } = data;

    if (!sharedKeyRef.current || !ciphertext || !iv) return;

    try {
      const plaintext = await decryptMessage(
        { ciphertext, iv },
        sharedKeyRef.current
      );
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36),
          text: plaintext,
          mine: false,
          isSystem: false,
        },
      ]);
    } catch (error) {
      // Silent fail: wrong key or corrupted message
      console.debug('Decryption failed (expected if keys out of sync)');
    }
  };

  const handlePeerLeft = () => {
    peerIdRef.current = null;
    sharedKeyRef.current = null;
    setPeerCount(1);
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36),
        text: 'User left',
        mine: false,
        isSystem: true,
      },
    ]);
  };

  // Signal event through API
  const signalEvent = async (event, data) => {
    try {
      const response = await fetch('/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, event, data }),
      });

      if (!response.ok) {
        console.error('Signal API error:', response.status);
      }
    } catch (error) {
      console.error('Failed to send signal:', error);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text) return;

    if (!sharedKeyRef.current) {
      console.error(
        'Cannot send: no shared key (peer not connected or key exchange failed)'
      );
      return;
    }

    try {
      const encrypted = await encryptMessage(text, sharedKeyRef.current);

      // Optimistic add to messages
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36),
          text,
          mine: true,
          isSystem: false,
        },
      ]);

      // Send encrypted message
      await signalEvent('message', encrypted);

      setInputValue('');
    } catch (error) {
      console.error('Encryption failed:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36),
          text: 'Failed to send message',
          mine: false,
          isSystem: true,
        },
      ]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.roomTitle}>{roomId}</h1>
          <button
            onClick={copyRoomId}
            className={styles.copyButton}
            title="Copy Room ID"
          >
            📋
          </button>
        </div>
        <div className={styles.badge}>
          <span className={styles.badgeIcon}>👥</span>
          <span className={styles.badgeText}>{peerCount}</span>
        </div>
      </header>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 && !isConnecting && peerCount === 1 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyIcon}>⏳</p>
            <p className={styles.emptyText}>
              Waiting for someone to join...
            </p>
            <p className={styles.emptySubtext}>
              Share this room ID: <strong>{roomId}</strong>
            </p>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.message} ${
                  msg.isSystem
                    ? styles.systemMessage
                    : msg.mine
                      ? styles.messageMinе
                      : styles.messageTheirs
                }`}
              >
                <div className={styles.messageBubble}>
                  <p className={styles.messageText}>{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className={styles.inputContainer}>
        {!sharedKeyRef.current && peerCount === 1 && (
          <div className={styles.waitingMessage}>
            ⏳ Waiting for peer to connect...
          </div>
        )}
        <div className={styles.inputBar}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className={styles.input}
            disabled={!sharedKeyRef.current && peerCount === 1}
          />
          <button
            onClick={handleSendMessage}
            disabled={
              !inputValue.trim() || (!sharedKeyRef.current && peerCount === 1)
            }
            className={styles.sendButton}
            title="Send message (Enter)"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
