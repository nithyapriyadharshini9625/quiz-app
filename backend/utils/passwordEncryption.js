const crypto = require('crypto');

// Use environment variable for encryption key, or default (should be set in production)
const ENCRYPTION_KEY = process.env.PASSWORD_ENCRYPTION_KEY || 'default-encryption-key-change-in-production-32chars!!';
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

// Ensure key is 32 bytes for AES-256
function getKey() {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

// Encrypt password
function encryptPassword(text) {
  if (!text) return text;
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Return plain text if encryption fails
  }
}

// Decrypt password
function decryptPassword(encryptedText) {
  if (!encryptedText) return encryptedText;
  
  // If it doesn't contain ':', it's likely not encrypted (legacy data)
  if (!encryptedText.includes(':')) {
    return encryptedText;
  }
  
  try {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = parts.join(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedText; // Return as-is if decryption fails
  }
}

module.exports = {
  encryptPassword,
  decryptPassword
};








