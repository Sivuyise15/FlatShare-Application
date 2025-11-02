// services/EncryptedChatAPI.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://flatshare-final.onrender.com';

export interface EncryptedChat {
  id: string;
  participants: string[];
  listingId?: string;
  listingTitle?: string;
  keyHash: string;
  createdAt: string;
  lastMessage?: {
    id: string;
    senderId: string;
    text: string;
    timestamp: string;
    encrypted: boolean;
  };
  lastActivity: string;
}

export interface EncryptedMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
  messageType: string;
  encrypted: boolean;
  decryptionError?: boolean;
}

class EncryptedChatAPI {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async createOrGetChat(otherUserId: string, listingId?: string, listingTitle?: string): Promise<EncryptedChat> {
    const response = await fetch(`${API_BASE_URL}/encrypted-chats/chats`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        otherUserId,
        listingId,
        listingTitle,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create/get chat');
    }

    return result.data;
  }

  async getUserChats(): Promise<EncryptedChat[]> {
    const response = await fetch(`${API_BASE_URL}/encrypted-chats/chats`, {
      headers: await this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to get chats');
    }

    return result.data;
  }

  async sendMessage(chatId: string, message: string, messageType: string = 'text'): Promise<EncryptedMessage> {
    const response = await fetch(`${API_BASE_URL}/encrypted-chats/chats/${chatId}/messages`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        message,
        messageType,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to send message');
    }

    return result.data;
  }

  async sendInitialMessage(
    otherUserId: string, 
    message: string, 
    listingId?: string, 
    listingTitle?: string
  ): Promise<{ chatId: string; message: EncryptedMessage }> {
    try {
      const chat = await this.createOrGetChat(otherUserId, listingId, listingTitle);
      
      const sentMessage = await this.sendMessage(chat.id, message);
      
      return {
        chatId: chat.id,
        message: sentMessage
      };
    } catch (error) {
      console.error('Failed to send initial message:', error);
      throw error;
    }
  }

  async getChatMessages(chatId: string, limit: number = 50): Promise<EncryptedMessage[]> {
    const response = await fetch(`${API_BASE_URL}/encrypted-chats/chats/${chatId}/messages?limit=${limit}`, {
      headers: await this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to get messages');
    }

    return result.data;
  }
}

export const encryptedChatAPI = new EncryptedChatAPI();