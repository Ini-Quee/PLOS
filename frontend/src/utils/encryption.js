/**
 * Zero-Knowledge Encryption Utilities
 *
 * AES-256-GCM encryption for journal entries.
 * Key derivation from user password using PBKDF2.
 *
 * IMPORTANT: Keys never leave the device. Backend stores only encrypted data.
 */

// Encryption constants
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;
const SALT_LENGTH = 32;
const IV_LENGTH = 12; // GCM standard

/**
 * Generate cryptographically secure random salt
 * Returns base64-encoded 32-byte salt
 */
export const generateSalt = async () => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return arrayBufferToBase64(randomBytes.buffer);
};

/**
 * Generate cryptographically secure random IV (Initialization Vector)
 * Returns base64-encoded 12-byte IV (GCM standard)
 */
export const generateIV = async () => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  return arrayBufferToBase64(randomBytes.buffer);
};

/**
 * Derive encryption key from user password using PBKDF2
 *
 * @param password - User's master password (never stored)
 * @param saltBase64 - Base64-encoded salt
 * @returns CryptoKey for AES-GCM encryption
 */
export const deriveKey = async (password, saltBase64) => {
  const enc = new TextEncoder();
  const passwordBuffer = enc.encode(password);
  const saltBuffer = base64ToArrayBuffer(saltBase64);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES-GCM key from password
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: KEY_LENGTH,
    },
    false, // Not extractable - can't export the key
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypt plaintext using AES-256-GCM
 *
 * @param plaintext - Text to encrypt (journal entry)
 * @param password - User's master password
 * @returns Object with encrypted content, IV, and salt (all base64)
 */
export const encryptText = async (plaintext, password) => {
  try {
    // Generate random salt and IV for this encryption
    const salt = await generateSalt();
    const iv = await generateIV();

    // Derive encryption key from password
    const key = await deriveKey(password, salt);

    // Encode plaintext to bytes
    const enc = new TextEncoder();
    const plaintextBuffer = enc.encode(plaintext);

    // Encrypt using AES-GCM
    const ivBuffer = base64ToArrayBuffer(iv);
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      key,
      plaintextBuffer
    );

    // Convert encrypted data to base64
    const encryptedContent = arrayBufferToBase64(encryptedBuffer);

    return {
      encryptedContent,
      encryptionIv: iv,
      encryptionSalt: salt,
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt content. Please try again.');
  }
};

/**
 * Decrypt ciphertext using AES-256-GCM
 *
 * @param encryptedContent - Base64-encoded encrypted data
 * @param encryptionIv - Base64-encoded IV
 * @param encryptionSalt - Base64-encoded salt
 * @param password - User's master password
 * @returns Decrypted plaintext
 */
export const decryptText = async (
  encryptedContent,
  encryptionIv,
  encryptionSalt,
  password
) => {
  try {
    // Derive decryption key from password and salt
    const key = await deriveKey(password, encryptionSalt);

    // Convert base64 inputs to ArrayBuffers
    const encryptedBuffer = base64ToArrayBuffer(encryptedContent);
    const ivBuffer = base64ToArrayBuffer(encryptionIv);

    // Decrypt using AES-GCM
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      key,
      encryptedBuffer
    );

    // Convert decrypted bytes back to text
    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error(
      'Failed to decrypt content. Wrong password or corrupted data.'
    );
  }
};

// ═══════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════

/**
 * Convert ArrayBuffer to base64 string
 */
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Convert base64 string to ArrayBuffer
 */
const base64ToArrayBuffer = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Check if Web Crypto API is available
 */
export const isEncryptionAvailable = () => {
  return (
    typeof window !== 'undefined' &&
    window.crypto &&
    window.crypto.subtle
  );
};

/**
 * Test encryption/decryption
 * Useful for verifying the system works
 */
export const testEncryption = async () => {
  try {
    const testText = 'Hello, PLOS!';
    const testPassword = 'test-password-123';

    console.log('Testing encryption...');
    const encrypted = await encryptText(testText, testPassword);
    console.log('Encrypted:', encrypted);

    console.log('Testing decryption...');
    const decrypted = await decryptText(
      encrypted.encryptedContent,
      encrypted.encryptionIv,
      encrypted.encryptionSalt,
      testPassword
    );
    console.log('Decrypted:', decrypted);

    const success = decrypted === testText;
    console.log('Test passed:', success);
    return success;
  } catch (error) {
    console.error('Encryption test failed:', error);
    return false;
  }
};

// Export all as default
export default {
  generateSalt,
  generateIV,
  deriveKey,
  encryptText,
  decryptText,
  isEncryptionAvailable,
  testEncryption,
};
