/**
 * Web Crypto API utilities for end-to-end encrypted messaging
 * All operations use ECDH (P-256) for key exchange and AES-GCM for encryption
 */

/**
 * Generate an ECDH key pair for key exchange
 * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey}>}
 */
export async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true, // extractable
    ['deriveKey', 'deriveBits']
  );

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  };
}

/**
 * Export a public key to Base64 string
 * @param {CryptoKey} publicKey
 * @returns {Promise<string>} Base64 encoded public key
 */
export async function exportPublicKey(publicKey) {
  const raw = await crypto.subtle.exportKey('raw', publicKey);
  const bytes = new Uint8Array(raw);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Import a Base64 public key
 * @param {string} base64
 * @returns {Promise<CryptoKey>}
 */
export async function importPublicKey(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return await crypto.subtle.importKey(
    'raw',
    bytes.buffer,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
}

/**
 * Derive a shared AES-GCM key from ECDH exchange
 * @param {CryptoKey} myPrivateKey
 * @param {CryptoKey} theirPublicKey
 * @returns {Promise<CryptoKey>} AES-GCM key
 */
export async function deriveSharedKey(myPrivateKey, theirPublicKey) {
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: theirPublicKey,
    },
    myPrivateKey,
    256 // 256 bits for AES-256
  );

  return await crypto.subtle.importKey(
    'raw',
    derivedBits,
    {
      name: 'AES-GCM',
    },
    false, // not extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a message with AES-GCM
 * @param {string} text
 * @param {CryptoKey} aesKey
 * @returns {Promise<{ciphertext: string, iv: string}>} Base64 encoded
 */
export async function encryptMessage(text, aesKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // Generate random 12-byte IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    data
  );

  // Convert to Base64
  const ciphertextBytes = new Uint8Array(ciphertext);
  let ciphertextBinary = '';
  for (let i = 0; i < ciphertextBytes.byteLength; i++) {
    ciphertextBinary += String.fromCharCode(ciphertextBytes[i]);
  }

  let ivBinary = '';
  for (let i = 0; i < iv.byteLength; i++) {
    ivBinary += String.fromCharCode(iv[i]);
  }

  return {
    ciphertext: btoa(ciphertextBinary),
    iv: btoa(ivBinary),
  };
}

/**
 * Decrypt a message with AES-GCM
 * @param {{ciphertext: string, iv: string}} encrypted
 * @param {CryptoKey} aesKey
 * @returns {Promise<string>} plaintext
 * @throws on decryption failure
 */
export async function decryptMessage({ ciphertext, iv }, aesKey) {
  // Decode Base64
  const ciphertextBinary = atob(ciphertext);
  const ciphertextBytes = new Uint8Array(ciphertextBinary.length);
  for (let i = 0; i < ciphertextBinary.length; i++) {
    ciphertextBytes[i] = ciphertextBinary.charCodeAt(i);
  }

  const ivBinary = atob(iv);
  const ivBytes = new Uint8Array(ivBinary.length);
  for (let i = 0; i < ivBinary.length; i++) {
    ivBytes[i] = ivBinary.charCodeAt(i);
  }

  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes,
    },
    aesKey,
    ciphertextBytes
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintext);
}
