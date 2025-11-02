// backend/controllers/EncryptedChatController.js
{/*
  EncryptedChatController handles HTTP requests related to encrypted chats.
  It uses EncryptedChatService for business logic and Firestore for data storage.
  It includes methods for creating/getting chats, sending messages, retrieving messages, and listing user chats.
  */}
const EncryptedChatService = require('../services/encryptedChat.service');

class EncryptedChatController {
  constructor(db) {
    this.chatService = new EncryptedChatService(db);
  }
  // Create or get an existing chat between two users
  async createOrGetChat(req, res) {
    try {
      const { otherUserId, listingId, listingTitle } = req.body;
      const currentUserId = req.user?.uid;

      if (!currentUserId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      if (!otherUserId) {
        return res.status(400).json({ success: false, error: 'Other user ID is required' });
      }

      if (currentUserId === otherUserId) {
        return res.status(400).json({ success: false, error: 'Cannot create chat with yourself' });
      }

      const chat = await this.chatService.createOrGetChat(
        [currentUserId, otherUserId], 
        listingId, 
        listingTitle
      );

      res.json({ success: true, data: chat.toJSON() });
    } catch (error) {
      console.error('Error creating/getting chat:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
 // Send a message in a chat
  async sendMessage(req, res) {
    try {
      const { chatId } = req.params;
      const { message, messageType } = req.body;
      const senderId = req.user?.uid;

      if (!senderId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      if (!message?.trim()) {
        return res.status(400).json({ success: false, error: 'Message content is required' });
      }

      const sentMessage = await this.chatService.sendMessage(
        chatId, 
        senderId, 
        message.trim(), 
        messageType || 'text'
      );

      res.status(201).json({ success: true, data: sentMessage.toJSON() });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  // Retrieve messages from a chat
  async getMessages(req, res) {
    try {
      const { chatId } = req.params;
      const { limit } = req.query;
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const messages = await this.chatService.getDecryptedMessages(
        chatId, 
        userId, 
        parseInt(limit) || 50
      );

      res.json({ success: true, data: messages });
    } catch (error) {
      console.error('Error getting messages:', error);
      
      if (error.message === 'Unauthorized access to chat') {
        return res.status(403).json({ success: false, error: error.message });
      }
      
      res.status(500).json({ success: false, error: error.message });
    }
  }
 // List all chats for the authenticated user
  async getUserChats(req, res) {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const chats = await this.chatService.getUserChats(userId);

      res.json({ success: true, data: chats });
    } catch (error) {
      console.error('Error getting user chats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = EncryptedChatController;