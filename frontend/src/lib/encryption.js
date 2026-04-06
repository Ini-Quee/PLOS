const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;

async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}

export async function encryptText(plaintext, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(password, salt);

  const encoder = new TextEncoder();
  const plaintextBuffer = encoder.encode(plaintext);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintextBuffer
  );

  const ciphertext = btoa(
    String.fromCharCode(...new Uint8Array(ciphertextBuffer))
  );
  const ivBase64 = btoa(String.fromCharCode(...iv));
  const saltBase64 = btoa(String.fromCharCode(...salt));

  return {
    ciphertext,
    iv: ivBase64,
    salt: saltBase64,
  };
}

export async function decryptText(ciphertext, ivBase64, saltBase64, password) {
  const ciphertextBuffer = Uint8Array.from(atob(ciphertext), (c) =>
    c.charCodeAt(0)
  );
  const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));
  const salt = Uint8Array.from(atob(saltBase64), (c) =>
    c.charCodeAt(0)
  );

  const key = await deriveKey(password, salt);

  try {
    const plaintextBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(plaintextBuffer);
  } catch {
    throw new Error('Decryption failed. Wrong password or corrupted data.');
  }
}

export function generateEncryptionPassword() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}