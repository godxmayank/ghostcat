'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import PusherJS, { Channel } from 'pusher-js';
import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
} from '@/lib/crypto';
import { getUsername } from '@/lib/user';
import ChatBox, { Message } from '@/components/ChatBox';
import UserBar from '@/components/UserBar';
import styles from './page.module.css';

interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export default function ChatScreen() {
  const params = useParams();
  const roomId = decodeURIComponent(params.roomId as string);

  // Key exchange state
  const myKeyPairRef = useRef<KeyPair | null>(null);
  const myPublicKeyB64Ref = useRef<string>('');
  const peerIdRef = useRef<string | null>(null);
  const sharedKeyRef = useRef<CryptoKey | null>(null);

  // UI state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [onlineCount, setOnlineCount] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  // Auto-delete settings
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(false);
  const [deleteTimeOption, setDeleteTimeOption] = useState(0);

  // Typing state
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const channelRef = useRef<Channel | null>(null);
  const pusherRef = useRef<PusherJS | null>(null);

  const username = getUsername();

  // Scroll to bottom
  useEffect(() => {
    const scrollTimout = setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 0);
    return () => clearTimeout(scrollTimout);
  }, [messages, typingUsers]);

  // Initialize Pusher and keys
  useEffect(() => {
    const initializeChat = async () => {
      try {
        if (
          !process.env.NEXT_PUBLIC_PUSHER_KEY ||
          !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
        ) {
          addSystemMessage('Configuration error: Pusher credentials missing');
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
        channelRef.current.bind('peer-joined', (payload) => {
          handlePeerJoined(payload);
        });

        channelRef.current.bind('share-key', (payload) => {
          handleShareKey(payload);
        });

        channelRef.current.bind('message', (payload) => {
          handleMessage(payload);
        });

        channelRef.current.bind('peer-left', () => {
          handlePeerLeft();
        });

        channelRef.current.bind('typing', (payload) => {
          handleTyping(payload);
        });

        // Notify others that we joined
        await signalEvent('peer-joined', {
          publicKey: myPublicKeyB64Ref.current,
          username,
        });

        setIsConnected(true);
      } catch (error) {
        console.error('Chat initialization error:', error);
        addSystemMessage('Failed to initialize chat');
      }
    };

    initializeChat();

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusherRef.current?.unsubscribe(roomId);
      }
      myKeyPairRef.current = null;
      peerIdRef.current = null;
      sharedKeyRef.current = null;
      setMessages([]);
    };
  }, [roomId]);

  // Handle beforeunload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (peerIdRef.current) {
        try {
          await signalEvent('peer-left', {});
        } catch {
          // Ignored
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Event handlers
  const handlePeerJoined = async (payload: { data: { publicKey: string; username?: string } }) => {
    const { publicKey, username: peerUsername } = payload.data;

    if (!publicKey) return;

    if (!peerIdRef.current) {
      peerIdRef.current = Math.random().toString(36).substring(2, 11);
      setOnlineCount(2);

      try {
        const theirPublicKey = await importPublicKey(publicKey);
        const sharedKey = await deriveSharedKey(
          myKeyPairRef.current!.privateKey,
          theirPublicKey
        );
        sharedKeyRef.current = sharedKey;

        await signalEvent('share-key', {
          publicKey: myPublicKeyB64Ref.current,
          username,
        });

        addSystemMessage(`${peerUsername || 'User'} joined`);
      } catch (error) {
        console.error('Error deriving shared key:', error);
      }
    }
  };

  const handleShareKey = async (payload: { data: { publicKey: string; username?: string } }) => {
    const { publicKey, username: peerUsername } = payload.data;

    if (!publicKey || sharedKeyRef.current) return;

    try {
      const theirPublicKey = await importPublicKey(publicKey);
      const sharedKey = await deriveSharedKey(
        myKeyPairRef.current!.privateKey,
        theirPublicKey
      );
      sharedKeyRef.current = sharedKey;

      if (!peerIdRef.current) {
        peerIdRef.current = Math.random().toString(36).substring(2, 11);
        setOnlineCount(2);
        addSystemMessage(`${peerUsername || 'User'} joined`);
      }
    } catch (error) {
      console.error('Error importing peer key:', error);
    }
  };

  const handleMessage = async (payload: { data: { ciphertext: string; iv: string; username?: string } }) => {
    const { ciphertext, iv, username: senderUsername } = payload.data;

    if (!sharedKeyRef.current || !ciphertext || !iv) return;

    try {
      const plaintext = await decryptMessage(
        { ciphertext, iv },
        sharedKeyRef.current
      );

      const msg: Message = {
        id: Math.random().toString(36),
        text: plaintext,
        username: senderUsername || 'Anonymous',
        isOwn: false,
        isSystem: false,
        timestamp: Date.now(),
        autoDeleteTime: autoDeleteEnabled ? deleteTimeOption : undefined,
      };

      setMessages((prev) => [...prev, msg]);
    } catch (error) {
      console.debug('Decryption failed');
    }
  };

  const handlePeerLeft = () => {
    peerIdRef.current = null;
    sharedKeyRef.current = null;
    setOnlineCount(1);
    addSystemMessage('User left');
  };

  const handleTyping = (payload: { data: { username: string } }) => {
    const { username: typingUsername } = payload.data;
    
    setTypingUsers((prev) => {
      if (!prev.includes(typingUsername)) {
        return [...prev, typingUsername];
      }
      return prev;
    });

    // Clear typing indicator after 2 seconds
    clearTimeout(typingTimeoutRef.current as NodeJS.Timeout);
    typingTimeoutRef.current = setTimeout(() => {
      setTypingUsers((prev) =>
        prev.filter((u) => u !== typingUsername)
      );
    }, 2000);
  };

  // Helpers
  const addSystemMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36),
        text,
        isOwn: false,
        isSystem: true,
        timestamp: Date.now(),
      },
    ]);
  };

  const signalEvent = async (event: string, data: unknown) => {
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

  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text || !sharedKeyRef.current) return;

    try {
      const encrypted = await encryptMessage(text, sharedKeyRef.current);

      // Optimistic add
      const msg: Message = {
        id: Math.random().toString(36),
        text,
        username,
        isOwn: true,
        isSystem: false,
        timestamp: Date.now(),
        autoDeleteTime: autoDeleteEnabled ? deleteTimeOption : undefined,
      };

      setMessages((prev) => [...prev, msg]);
      await signalEvent('message', {
        ...encrypted,
        username,
      });

      setInputValue('');
      isTypingRef.current = false;
    } catch (error) {
      console.error('Encryption failed:', error);
      addSystemMessage('Failed to send message');
    }
  };

  const handleTypingEvent = () => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      signalEvent('typing', { username });

      setTimeout(() => {
        isTypingRef.current = false;
      }, 400);
    }
  };

  return (
    <div className={styles.container}>
      <UserBar onlineCount={onlineCount} roomId={roomId} />
      <ChatBox
        messages={messages}
        typingUsers={typingUsers}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSendMessage={handleSendMessage}
        onTyping={handleTypingEvent}
        isConnected={sharedKeyRef.current !== null}
        autoDeleteEnabled={autoDeleteEnabled}
        onAutoDeleteToggle={setAutoDeleteEnabled}
        deleteTimeOption={deleteTimeOption}
        onDeleteTimeChange={setDeleteTimeOption}
      />
    </div>
  );
}
