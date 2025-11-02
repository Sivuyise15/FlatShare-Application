// backend/services/encryptedChat.service.js
{/* This service handles encrypted chats between users, including creating chats, sending messages, and retrieving/decrypting messages.
  It serves as an intermediary between controllers and the data layer.
  */}
const EncryptedChatRepository = require('../repositories/EncryptedChatRepository');
const EncryptedChat = require('../entities/EncryptedChat');
const EncryptedMessage = require('../entities/EncryptedMessage');
const EncryptionService = require('./encryption.service');

class EncryptedChatService {
  constructor(db) {
    this.repository = new EncryptedChatRepository(db);
    this.encryptionService = new EncryptionService();
  }
  // Create or get existing chat between two users
  async createOrGetChat(participantIds, listingId = null, listingTitle = null) {
    if (participantIds.length !== 2) {
      throw new Error('Exactly two participants required');
    }

    // Check if chat already exists
    const existingChat = await this.repository.findChatByParticipants(participantIds, listingId);
    if (existingChat) {
      return existingChat;
    }

    // Generate encryption key and hash
    const encryptionKey = this.encryptionService.generateChatKey(participantIds);
    const keyHash = require('crypto').createHash('sha256').update(encryptionKey).digest('hex');

    // Create new chat
    const chat = new EncryptedChat(participantIds, listingId, listingTitle, keyHash);
    return await this.repository.createChat(chat);
  }

  async sendMessage(chatId, senderId, plainTextMessage, messageType = 'text') {
    // Get chat to retrieve encryption key info
    const chat = await this.repository.chatsRef.doc(chatId).get();
    if (!chat.exists) {
      throw new Error('Chat not found');
    }

    const chatData = chat.data();
    
    // Regenerate encryption key from participants
    const encryptionKey = this.encryptionService.generateChatKey(chatData.participants);
    
    // Encrypt the message
    const encrypted = this.encryptionService.encrypt(plainTextMessage, encryptionKey);
    
    // Create encrypted message entity
    const message = new EncryptedMessage(
      chatId,
      senderId,
      encrypted.encrypted,
      encrypted.iv,
      encrypted.tag,
      new Date(),
      messageType
    );
    
    return await this.repository.addMessage(message);
  }

  async getDecryptedMessages(chatId, userId, limit = 50) {
    // Get chat to verify user is participant
    const chat = await this.repository.chatsRef.doc(chatId).get();
    if (!chat.exists) {
      throw new Error('Chat not found');
    }

    const chatData = chat.data();
    if (!chatData.participants.includes(userId)) {
      throw new Error('Unauthorized access to chat');
    }

    // Get encrypted messages
    const encryptedMessages = await this.repository.getMessagesByChatId(chatId, limit);
    
    // Generate decryption key
    const encryptionKey = this.encryptionService.generateChatKey(chatData.participants);
    
    // Decrypt messages
    const decryptedMessages = encryptedMessages.map(message => {
      try {
        const decryptedContent = this.encryptionService.decrypt({
          encrypted: message.encryptedContent,
          iv: message.iv,
          tag: message.tag
        }, encryptionKey);
        
        return {
          ...message.toJSON(),
          text: decryptedContent, // Add decrypted text
          encrypted: true // Flag to indicate this was encrypted
        };
      } catch (error) {
        console.error('Failed to decrypt message:', message.id, error);
        return {
          ...message.toJSON(),
          text: '[Message could not be decrypted]',
          encrypted: true,
          decryptionError: true
        };
      }
    });

    return decryptedMessages;
  }
  // Get all chats for a user with last message preview
  async getUserChats(userId) {
    const chats = await this.repository.getChatsByUserId(userId);
    
    // Add last message preview (encrypted)
    const chatsWithMessages = await Promise.all(
      chats.map(async (chat) => {
        const messages = await this.repository.getMessagesByChatId(chat.id, 1);
        const chatJson = chat.toJSON();
        
        if (messages.length > 0) {
          const lastMessage = messages[0];
          // Don't decrypt here for privacy - let frontend handle it
          chatJson.lastMessage = {
            ...lastMessage.toJSON(),
            text: '[Encrypted]' // Placeholder
          };
        }
        
        return chatJson;
      })
    );

    return chatsWithMessages;
  }
}

module.exports = EncryptedChatService;