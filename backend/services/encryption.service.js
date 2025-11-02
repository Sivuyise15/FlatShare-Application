{/*
  This service handles encryption and decryption of messages.
  It provides methods to generate keys, encrypt messages, and decrypt messages.
*/}

const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16;  // 128 bits
  }

  // Generate a random encryption key
  generateKey() {
    return crypto.randomBytes(this.keyLength);
  }

  // Generate a random initialization vector
  generateIV() {
    return crypto.randomBytes(this.ivLength);
  }

  // Encrypt a message
  encrypt(plaintext, key) {
    try {
      const iv = this.generateIV();
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  // Decrypt a message
  decrypt(encryptedData, key) {
    try {
      const { encrypted, iv, tag } = encryptedData;

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        key,
        Buffer.from(iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(tag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  // Generate a chat room key from participant IDs
  generateChatKey(participantIds) {
    const sortedIds = participantIds.sort();
    const combined = sortedIds.join('-');
    return crypto.createHash('sha256').update(combined).digest();
  }
}

module.exports = EncryptionService;
