import { encryptedChatAPI, EncryptedMessage } from '@/services/EncryptedChatAPI';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  View, 
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

export default function EncryptedChatRoom() {
  const { chatId, otherUser, listingTitle } = useLocalSearchParams<{
    chatId: string;
    otherUser: string;
    listingTitle: string;
  }>();
  
  const [messages, setMessages] = useState<EncryptedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    initializeChat();
  }, [chatId]);

  const initializeChat = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      setCurrentUserId(userId);
      
      if (!userId || !chatId) {
        Alert.alert('Error', 'Missing user or chat information');
        router.back();
        return;
      }

      await loadMessages();
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!chatId) return;

    try {
      console.log('Loading encrypted messages for chat:', chatId);
      const chatMessages = await encryptedChatAPI.getChatMessages(chatId);
      console.log('Loaded encrypted messages:', chatMessages.length);
      
      setMessages(chatMessages);
      
      // Scroll to bottom after messages load
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      console.error('Error loading messages:', error);
      if (typeof error === 'object' && error !== null && 'message' in error && (error as { message?: string }).message === 'Unauthorized access to chat') {
        Alert.alert('Access Denied', 'You do not have access to this chat');
        router.back();
      } else {
        Alert.alert('Error', 'Failed to load messages');
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      console.log('Sending encrypted message...');
      await encryptedChatAPI.sendMessage(chatId, messageText);
      
      // Reload messages to get the encrypted version
      await loadMessages();
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: EncryptedMessage }) => {
    const isMyMessage = item.senderId === currentUserId;
    const timestamp = dayjs(item.timestamp).format('HH:mm');
    const isDecrypted = !item.decryptionError;

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          !isDecrypted && styles.errorMessageBubble
        ]}>
          {!isDecrypted && (
            <View style={styles.decryptionError}>
              <Ionicons name="warning" size={14} color="#ef4444" />
              <Text style={styles.errorText}>Decryption failed</Text>
            </View>
          )}
          
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText,
            !isDecrypted && styles.errorMessageText
          ]}>
            {item.text}
          </Text>
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.timestamp,
              isMyMessage ? styles.myTimestamp : styles.otherTimestamp
            ]}>
              {timestamp}
            </Text>
            {item.encrypted && (
              <Ionicons 
                name="shield-checkmark" 
                size={12} 
                color={isMyMessage ? '#ffffff80' : '#00000060'} 
                style={styles.encryptedIcon}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading encrypted chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {listingTitle || `User ${otherUser?.substring(0, 8)}`}
          </Text>
          <View style={styles.encryptionStatus}>
            <Ionicons name="shield-checkmark" size={14} color="#10b981" />
            <Text style={styles.encryptionStatusText}>End-to-end encrypted</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="information-circle-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Ionicons name="shield-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>This conversation is encrypted</Text>
            <Text style={styles.emptySubtext}>Messages are secured with end-to-end encryption</Text>
          </View>
        }
      />

      {/* Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Type an encrypted message..."
            placeholderTextColor="#999"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
            editable={!sending}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <Ionicons name="hourglass" size={20} color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputFooter}>
          <Ionicons name="lock-closed" size={12} color="#10b981" />
          <Text style={styles.inputFooterText}>Your messages are encrypted</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  encryptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  encryptionStatusText: {
    fontSize: 12,
    color: '#10b981',
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 4,
  },
  messagesList: {
    paddingVertical: 8,
  },
  messageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: '#4f46e5',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  errorMessageBubble: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  decryptionError: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#111827',
  },
  errorMessageText: {
    color: '#ef4444',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  myTimestamp: {
    color: '#ffffff80',
  },
  otherTimestamp: {
    color: '#6b7280',
  },
  encryptedIcon: {
    marginLeft: 4,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
    backgroundColor: '#f9fafb',
  },
  sendButton: {
    backgroundColor: '#4f46e5',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  inputFooterText: {
    fontSize: 11,
    color: '#10b981',
    marginLeft: 4,
  },
  // Chat List Styles
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatarContainer: {
    position: 'relative',
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  encryptionBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  listingSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  lastMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  encryptedIndicator: {
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  allChatsTab: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  allChatsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
});

// Integration helper for existing chat functionality
export const integrateBankendChat = {
  // Replace existing sendMessage calls with this
  sendEncryptedMessage: async (otherUserId: string, message: string, listingId?: string, listingTitle?: string) => {
    try {
      // Create or get chat
      const chat = await encryptedChatAPI.createOrGetChat(otherUserId, listingId, listingTitle);
      
      // Send message
      await encryptedChatAPI.sendMessage(chat.id, message);
      
      return chat.id;
    } catch (error) {
      console.error('Error sending encrypted message:', error);
      throw error;
    }
  },

  // Replace existing chat list loading with this
  loadEncryptedChats: async () => {
    try {
      return await encryptedChatAPI.getUserChats();
    } catch (error) {
      console.error('Error loading encrypted chats:', error);
      throw error;
    }
  }
};