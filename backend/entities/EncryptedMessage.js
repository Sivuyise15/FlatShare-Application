// backend/entities/EncryptedMessage.js
{/*
  This class represents an encrypted message entity in a secure messaging application.
  It includes methods for serialization/deserialization to/from Firestore, as well as input validation.
*/}
class EncryptedMessage {
  constructor(chatId, senderId, encryptedContent, iv, tag, timestamp = new Date(), messageType = 'text', id = null) {
    this.validateInputs(chatId, senderId, encryptedContent, iv, tag);
    
    this.id = id;
    this.chatId = chatId;
    this.senderId = senderId;
    this.encryptedContent = encryptedContent;
    this.iv = iv;
    this.tag = tag;
    this.timestamp = timestamp instanceof Date ? timestamp : new Date(timestamp);
    this.messageType = messageType; // 'text', 'image', 'file'
    this.read = false;
  }
  // Validate inputs
  validateInputs(chatId, senderId, encryptedContent, iv, tag) {
    if (!chatId || typeof chatId !== 'string') {
      throw new Error('Chat ID is required');
    }
    if (!senderId || typeof senderId !== 'string') {
      throw new Error('Sender ID is required');
    }
    if (!encryptedContent || typeof encryptedContent !== 'string') {
      throw new Error('Encrypted content is required');
    }
    if (!iv || typeof iv !== 'string') {
      throw new Error('IV is required');
    }
    if (!tag || typeof tag !== 'string') {
      throw new Error('Auth tag is required');
    }
  }
  // Firestore serialization/deserialization
  static fromFirestore(doc) {
    const data = doc.data();
    return new EncryptedMessage(
      data.chatId,
      data.senderId,
      data.encryptedContent,
      data.iv,
      data.tag,
      data.timestamp?.toDate?.() || data.timestamp,
      data.messageType,
      doc.id
    );
  }
  // Convert to Firestore format
  toFirestore() {
    return {
      chatId: this.chatId,
      senderId: this.senderId,
      encryptedContent: this.encryptedContent,
      iv: this.iv,
      tag: this.tag,
      timestamp: this.timestamp,
      messageType: this.messageType,
      read: this.read
    };
  }
  // Convert to JSON for API responses
  toJSON() {
    return {
      id: this.id,
      chatId: this.chatId,
      senderId: this.senderId,
      encryptedContent: this.encryptedContent,
      iv: this.iv,
      tag: this.tag,
      timestamp: this.timestamp,
      messageType: this.messageType,
      read: this.read
    };
  }
}

module.exports = EncryptedMessage;
// backend/services/encryption.service.js