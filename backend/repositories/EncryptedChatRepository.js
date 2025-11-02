// backend/repositories/EncryptedChatRepository.js
{/* This repository manages encrypted chat sessions and messages between users.
    It provides methods to create chats, find chats by participants, retrieve chats for a user,
    add messages to a chat, and fetch messages for a specific chat.
  */}
const BaseRepository = require('./BaseRepository');
const EncryptedChat = require('../entities/EncryptedChat');
const EncryptedMessage = require('../entities/EncryptedMessage');

class EncryptedChatRepository extends BaseRepository {
  constructor(db) {
    super(db);
    this.chatsRef = this.db.collection('encrypted_chats');
    this.messagesRef = this.db.collection('encrypted_messages');
  }
  // Create a new encrypted chat session
  async createChat(chatEntity) {
    if (!(chatEntity instanceof EncryptedChat)) {
      throw new Error('Invalid chat entity provided');
    }

    try {
      const docRef = await this.chatsRef.add(chatEntity.toFirestore());
      chatEntity.id = docRef.id;
      return chatEntity;
    } catch (error) {
      this.handleError('create chat', error);
    }
  }
  // Find a chat by participant IDs and optional listing ID
  async findChatByParticipants(participantIds, listingId = null) {
    try {
      let query = this.chatsRef.where('participants', '==', participantIds.sort());
      
      if (listingId) {
        query = query.where('listingId', '==', listingId);
      }
      
      const snapshot = await query.limit(1).get();
      
      if (snapshot.empty) {
        return null;
      }
      
      return EncryptedChat.fromFirestore(snapshot.docs[0]);
    } catch (error) {
      this.handleError('find chat by participants', error);
    }
  }
  // Retrieve all chats for a specific user
  async getChatsByUserId(userId) {
    try {
      const snapshot = await this.chatsRef
        .where('participants', 'array-contains', userId)
        .orderBy('lastActivity', 'desc')
        .get();
      
      return snapshot.docs.map(doc => EncryptedChat.fromFirestore(doc));
    } catch (error) {
      this.handleError('get chats by user', error);
    }
  }
  // Add a message to a chat
  async addMessage(messageEntity) {
    if (!(messageEntity instanceof EncryptedMessage)) {
      throw new Error('Invalid message entity provided');
    }

    try {
      const docRef = await this.messagesRef.add(messageEntity.toFirestore());
      messageEntity.id = docRef.id;
      
      // Update chat's last activity
      await this.chatsRef.doc(messageEntity.chatId).update({
        lastActivity: messageEntity.timestamp
      });
      
      return messageEntity;
    } catch (error) {
      this.handleError('add message', error);
    }
  }
  // Fetch messages for a specific chat
  async getMessagesByChatId(chatId, limit = 50) {
    try {
      const snapshot = await this.messagesRef
        .where('chatId', '==', chatId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs
        .map(doc => EncryptedMessage.fromFirestore(doc))
        .reverse(); // Return in chronological order
    } catch (error) {
      this.handleError('get messages by chat', error);
    }
  }
}
module.exports = EncryptedChatRepository;