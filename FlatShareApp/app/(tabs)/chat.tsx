import { encryptedChatAPI, EncryptedChat } from '@/services/EncryptedChatAPI';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

dayjs.extend(relativeTime);

export default function EncryptedChatListScreen() {
  const [chats, setChats] = useState<EncryptedChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadUserAndChats();
  }, []);

  const loadUserAndChats = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      setCurrentUserId(userId);
      
      if (!userId) {
        setLoading(false);
        return;
      }

      await loadChats();
    } catch (error) {
      console.error('Error loading user and chats:', error);
      Alert.alert('Error', 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const loadChats = async () => {
    try {
      console.log('Loading encrypted chats...');
      const userChats = await encryptedChatAPI.getUserChats();
      console.log('Loaded encrypted chats:', userChats.length);
      
      // Enrich with user info (you might want to add an API endpoint for this)
      const enrichedChats = await Promise.all(
        userChats.map(async (chat) => {
          const otherParticipant = chat.participants.find(id => id !== currentUserId);
          
          // You can add user info enrichment here similar to your original code
          return {
            ...chat,
            otherUserInfo: {
              flatNumber: `User ${otherParticipant?.substring(0, 6)}`,
              userAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
              userId: otherParticipant,
              listingTitle: chat.listingTitle,
            }
          };
        })
      );
      
      setChats(enrichedChats);
    } catch (error) {
      console.error('Error loading chats:', error);
      Alert.alert('Error', 'Failed to load chats');
    }
  };

  const renderChatItem = ({ item }: { item: EncryptedChat & { otherUserInfo?: any } }) => {
    const displayName = item.otherUserInfo?.flatNumber || `User ${item.participants[0]?.substring(0, 8)}`;
    const displayAvatar = item.otherUserInfo?.userAvatar || 'https://randomuser.me/api/portraits/men/1.jpg';
    
    const lastMessageTime = item.lastMessage?.timestamp 
      ? dayjs(item.lastMessage.timestamp).format('HH:mm')
      : '';
    
    const messagePreview = item.lastMessage?.encrypted 
      ? '🔒 Encrypted message'
      : item.lastMessage?.text || 'Start a secure conversation...';

    return (
      <TouchableOpacity 
        style={styles.chatItem}
        onPress={() => {
          router.push({
            pathname: "../chat-room",
            params: { 
              chatId: item.id,
              otherUser: item.participants.find(id => id !== currentUserId),
              listingId: item.listingId,
              listingTitle: item.listingTitle || displayName
            }
          });
        }}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: displayAvatar }} style={styles.chatAvatar} />
          <View style={styles.encryptionBadge}>
            <Ionicons name="lock-closed" size={12} color="#fff" />
          </View>
        </View>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{displayName}</Text>
            <Text style={styles.timeText}>{lastMessageTime}</Text>
          </View>
          
          {item.listingTitle && (
            <Text style={styles.listingSubtitle}>
              About: {item.listingTitle}
            </Text>
          )}
          
          <View style={styles.lastMessageRow}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {messagePreview}
            </Text>
            <View style={styles.encryptedIndicator}>
              <Ionicons name="shield-checkmark" size={14} color="#10b981" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Encrypted Chats</Text>
        <View style={styles.encryptionStatus}>
          <Ionicons name="shield-checkmark" size={16} color="#10b981" />
          <Text style={styles.encryptionText}>End-to-End Encrypted</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading encrypted chats...</Text>
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="shield-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No encrypted chats yet</Text>
          <Text style={styles.emptySubtext}>
            {currentUserId ? "Start a secure conversation!" : "Please log in to view messages"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    position: 'absolute',
    left: 20,
    top: 35,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 15,
  },
  allChatsTab: {
    backgroundColor: '#4A3D6A',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 20,
    marginBottom: 20,
  },
  allChatsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 0,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  groupHeaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  subChatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
    borderLeftWidth: 3,
    borderLeftColor: '#4A3D6A',
  },
  subChatContent: {
    flex: 1,
  },
  subChatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A3D6A',
    flex: 1,
  },
  conversationsText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  groupSubtitle: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ddd',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  listingSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  lastMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ff6b6b',
    marginTop: 16, marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#4A3D6A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
  },
  encryptionBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#10b981',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  encryptedIndicator: {
    marginLeft: 6,
  },
  encryptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  encryptionText: {
    marginLeft: 6,
    fontSize: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
});
