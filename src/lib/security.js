import crypto from 'node:crypto'
import { env } from '../config/env.js'

// Derived 256-bit encryption key (32 bytes)
const ENCRYPTION_SECRET = env.jwtSecret || 'akiwa_256_bit_secure_master_encryption_key_default'
const KEY_256 = crypto.createHash('sha256').update(String(ENCRYPTION_SECRET)).digest()

/**
 * 256-Bit AES-GCM Authenticated Encryption
 * Encrypts arbitrary text or data payload using standard AES-256-GCM.
 * Output format: iv_hex:auth_tag_hex:ciphertext_hex
 */
export function encryptAES256(plainText) {
  if (typeof plainText !== 'string') {
    plainText = JSON.stringify(plainText)
  }

  // 12-byte (96-bit) IV for AES-GCM
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY_256, iv)

  let encrypted = cipher.update(plainText, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')

  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

/**
 * 256-Bit AES-GCM Authenticated Decryption
 * Validates the authentication tag to ensure data integrity and decrypts ciphertext.
 */
export function decryptAES256(encryptedPayload) {
  if (!encryptedPayload || typeof encryptedPayload !== 'string') {
    return null
  }

  const parts = encryptedPayload.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid 256-bit encrypted payload format')
  }

  const [ivHex, authTagHex, encryptedHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY_256, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  try {
    return JSON.parse(decrypted)
  } catch {
    return decrypted
  }
}

/**
 * 256-Bit Cryptographic SHA-256 Hash
 */
export function hashSHA256(data, salt = '') {
  return crypto
    .createHash('sha256')
    .update(`${data}${salt}`)
    .digest('hex')
}

/**
 * 256-Bit HMAC (HMAC-SHA256) Signer
 */
export function signHMAC256(data, secret = ENCRYPTION_SECRET) {
  return crypto
    .createHmac('sha256', secret)
    .update(typeof data === 'string' ? data : JSON.stringify(data))
    .digest('hex')
}

/**
 * 256-Bit Secure Random Token Generator (64 hex characters = 256 bits)
 */
export function generateSecureToken256() {
  return crypto.randomBytes(32).toString('hex')
}
