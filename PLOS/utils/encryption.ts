/**
 * Encryption Utility Module - PLOS
 * 
 * Real AES-256-GCM encryption with PBKDF2 key derivation
 * Matches backend zero-knowledge architecture
 * 
 * Uses react-native-quick-crypto for Web Crypto API compatibility
 * - AES-256-GCM encryption
 * - PBKDF2 with 100,000 iterations, SHA-256
 * - Cryptographically secure random bytes
 * - Base64 encoding for storage/transmission
 */

// Import from react-native-quick-crypto for Web Crypto API compatibility
import { crypto } from 'react-native-quick-crypto';

/**
 * Convert Uint8Array to base64 string
 * @param buffer - Uint8Array to convert
 * @returns base64 encoded string
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
  const binary = String.fromCharCode(...buffer);
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 * @param base64 - base64 string to convert
 * @returns Uint8Array
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate 32 cryptographically secure random bytes for salt
 * 
 * Uses crypto.getRandomValues() for CSPRNG quality
 * @returns Promise<string> - Base64 encoded 32-byte salt
 */
export async function generateSalt(): Promise<string> {
  try {
    // Create 32-byte buffer for salt
    const saltBytes = new Uint8Array(32);
    
    // Fill with cryptographically secure random values
    crypto.getRandomValues(saltBytes);
    
    // Encode to base64 for storage/transmission
    return arrayBufferToBase64(saltBytes);
  } catch (error) {
    console.error('Error generating salt:', error);
    throw new Error('Failed to generate encryption salt');
  }
}

/**
 * Generate 12 cryptographically secure random bytes for IV
 * 
 * 12 bytes (96 bits) is the standard IV size for AES-GCM
 * Uses crypto.getRandomValues() for CSPRNG quality
 * @returns Promise<string> - Base64 encoded 12-byte IV
 */
export async function generateIV(): Promise<string> {
  try {
    // Create 12-byte buffer for IV (standard GCM IV size)
    const ivBytes = new Uint8Array(12);
    
    // Fill with cryptographically secure random values
    crypto.getRandomValues(ivBytes);
    
    // Encode to base64 for storage/transmission
    return arrayBufferToBase64(ivBytes);
  } catch (error) {
    console.error('Error generating IV:', error);
    throw new Error('Failed to generate encryption IV');
  }
}

/**
 * Derive AES-256-GCM key from password using PBKDF2
 * 
 * PBKDF2 Parameters:
 * - Iterations: 100,000 (OWASP recommended minimum)
 * - Hash: SHA-256
 * - Salt: 32 bytes (from generateSalt)
 * - Key length: 256 bits (32 bytes)
 * 
 * @param password - User's encryption password
 * @param saltBase64 - Base64 encoded salt (32 bytes)
 * @returns Promise<CryptoKey> - Derived AES-GCM 256-bit key
 */
export async function deriveKey(password: string, saltBase64: string): Promise<CryptoKey> {
  try {
    // Step 1: Decode salt from base64 to Uint8Array
    const salt = base64ToArrayBuffer(saltBase64);
    
    // Step 2: Convert password to UTF-8 encoded bytes
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);
    
    // Step 3: Import password as raw key material
    const baseKey = await crypto.subtle.importKey(
      'raw',                          // Format: raw bytes
      passwordBytes,                  // Key material
      { name: 'PBKDF2' },             // Algorithm: PBKDF2
      false,                          // Not extractable
      ['deriveKey']                   // Usages: key derivation only
    );
    
    // Step 4: Derive AES-GCM key using PBKDF2
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,                   // Salt from parameter
        iterations: 100000,           // 100,000 iterations (OWASP)
        hash: 'SHA-256',              // SHA-256 hash function
      },
      baseKey,                        // Base key material
      {
        name: 'AES-GCM',              // Target algorithm
        length: 256,                  // 256-bit key (AES-256)
      },
      false,                          // Not extractable from Web Crypto
      ['encrypt', 'decrypt']          // Allowed operations
    );
    
    return derivedKey;
  } catch (error) {
    console.error('Error deriving key:', error);
    throw new Error('Failed to derive encryption key. Check password and salt.');
  }
}

/**
 * Encrypt plaintext using AES-256-GCM
 * 
 * Process:
 * 1. Generate cryptographically secure salt (32 bytes)
 * 2. Generate cryptographically secure IV (12 bytes)
 * 3. Derive key from password + salt using PBKDF2
 * 4. Encode plaintext to UTF-8
 * 5. Encrypt using AES-GCM
 * 6. Return all values as base64
 * 
 * @param plaintext - Text to encrypt
 * @param password - Encryption password
 * @returns Promise<{ encryptedContent, encryptionIv, encryptionSalt }>
 */
export async function encryptText(
  plaintext: string,
  password: string
): Promise<{
  encryptedContent: string;
  encryptionIv: string;
  encryptionSalt: string;
}> {
  try {
    // Step 1: Generate random salt (32 bytes)
    const saltBase64 = await generateSalt();
    
    // Step 2: Generate random IV (12 bytes)
    const ivBase64 = await generateIV();
    
    // Step 3: Derive AES-256-GCM key from password and salt
    const key = await deriveKey(password, saltBase64);
    
    // Step 4: Decode IV from base64 to Uint8Array
    const iv = base64ToArrayBuffer(ivBase64);
    
    // Step 5: Encode plaintext to UTF-8 bytes
    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(plaintext);
    
    // Step 6: Encrypt using AES-GCM
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,                       // Initialization vector
      },
      key,                            // Derived AES-256 key
      plaintextBytes                  // Data to encrypt
    );
    
    // Step 7: Convert encrypted data to base64
    const encryptedContent = arrayBufferToBase64(new Uint8Array(encryptedBuffer));
    
    // Return all three components as base64
    return {
      encryptedContent,
      encryptionIv: ivBase64,
      encryptionSalt: saltBase64,
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed. Check password and try again.');
  }
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * 
 * Process:
 * 1. Decode IV, salt, and encrypted content from base64
 * 2. Derive key from password + salt using PBKDF2
 * 3. Decrypt using AES-GCM
 * 4. Decode UTF-8 bytes back to string
 * 
 * @param encryptedContent - Base64 encrypted ciphertext
 * @param encryptionIv - Base64 encoded IV
 * @param encryptionSalt - Base64 encoded salt
 * @param password - Encryption password
 * @returns Promise<string> - Original plaintext
 */
export async function decryptText(
  encryptedContent: string,
  encryptionIv: string,
  encryptionSalt: string,
  password: string
): Promise<string> {
  try {
    // Step 1: Decode all components from base64
    const iv = base64ToArrayBuffer(encryptionIv);
    const encryptedBytes = base64ToArrayBuffer(encryptedContent);
    
    // Step 2: Derive key from password and salt
    const key = await deriveKey(password, encryptionSalt);
    
    // Step 3: Decrypt using AES-GCM
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,                       // Must match encryption IV
      },
      key,                            // Derived AES-256 key
      encryptedBytes                  // Data to decrypt
    );
    
    // Step 4: Decode decrypted bytes to UTF-8 string
    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decryptedBuffer);
    
    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed. Wrong password or corrupted data.');
  }
}

/**
 * Test encryption/decryption roundtrip
 * 
 * Runs a complete test:
 * 1. Encrypt "Hello PLOS test" with test password
 * 2. Decrypt the ciphertext
 * 3. Verify result matches original
 * 4. Log detailed results to console
 * 
 * @returns Promise<boolean> - true if test passed, false if failed
 */
export async function testEncryption(): Promise<boolean> {
  const testMessage = 'Hello PLOS test';
  const testPassword = 'test_password_123';
  
  console.log('🧪 === ENCRYPTION TEST STARTED ===');
  console.log('Test message:', testMessage);
  console.log('Test password:', testPassword);
  
  try {
    // Step 1: Encrypt
    console.log('\n🔐 STEP 1: Encrypting...');
    const encrypted = await encryptText(testMessage, testPassword);
    console.log('Generated salt (base64):', encrypted.encryptionSalt);
    console.log('Generated IV (base64):', encrypted.encryptionIv);
    console.log('Encrypted content (base64, first 50 chars):', 
      encrypted.encryptedContent.substring(0, 50) + '...');
    
    // Step 2: Decrypt
    console.log('\n🔓 STEP 2: Decrypting...');
    const decrypted = await decryptText(
      encrypted.encryptedContent,
      encrypted.encryptionIv,
      encrypted.encryptionSalt,
      testPassword
    );
    console.log('Decrypted message:', decrypted);
    
    // Step 3: Verify
    console.log('\n✅ STEP 3: Verifying...');
    const success = decrypted === testMessage;
    
    if (success) {
      console.log('✅ ENCRYPTION TEST PASSED');
    } else {
      console.log('❌ ENCRYPTION TEST FAILED');
      console.log('Expected:', testMessage);
      console.log('Got:', decrypted);
    }
    
    console.log('=== ENCRYPTION TEST COMPLETED ===\n');
    return success;
  } catch (error) {
    console.error('❌ ENCRYPTION TEST ERROR:', error);
    console.log('=== ENCRYPTION TEST FAILED ===\n');
    return false;
  }
}
