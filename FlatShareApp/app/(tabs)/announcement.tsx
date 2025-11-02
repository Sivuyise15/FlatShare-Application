import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Announcement = {
  id: string;
  title: string;
  content: string;
  date: string;
  isRead?: boolean;
};

export default function AnnouncementDisplay() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userCommunity = await AsyncStorage.getItem("userCommunity");

      if (!token || !userCommunity) {
        console.error("Missing auth token or community");
        return;
      }

      console.log("Fetching announcements for community:", userCommunity);

      const response = await fetch(`https://flatshare-final.onrender.com/announcements?community=${userCommunity}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log("API Response:", result);

      if (response.ok) {
        // Adapt backend response into our state shape
        const fetched: Announcement[] = (result.data || result).map((ann: any) => ({
          id: ann.id,
          title: ann.title,
          content: ann.message, // Backend uses 'message', frontend expects 'content'
          date: new Date(ann.createdAt?.seconds ? ann.createdAt.seconds * 1000 : ann.createdAt).toDateString(),
          isRead: ann.isRead ?? false,
        }));
        console.log("Dated Announcements:", fetched);
        setAnnouncements(fetched);
      } else {
        console.error("Failed to fetch announcements:", result);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnnouncements();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
        <Text style={{ textAlign: 'center', marginTop: 10, color: '#666' }}>
          Loading announcements...
        </Text>
      </SafeAreaView>
    );
  }

  const handlePress = (id: string) => {
    setSelectedId(selectedId === id ? null : id);
    
    // Mark as read when expanded
    setAnnouncements(prev => 
      prev.map(ann => ann.id === id ? {...ann, isRead: true} : ann)
    );
  };

  const unreadCount = announcements.filter(ann => !ann.isRead).length;

  const renderItem = ({ item }: { item: Announcement }) => (
    <TouchableOpacity
      onPress={() => handlePress(item.id)}
      style={[
        styles.card,
        !item.isRead && styles.unreadCard
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Ionicons 
          name="megaphone" 
          size={20} 
          color={item.isRead ? "#6b7280" : "#4f46e5"} 
          style={{ marginRight: 8 }} 
        />
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={[
              styles.cardTitle,
              !item.isRead && styles.unreadTitle
            ]}>
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.unreadBadge} />}
          </View>
          <Text style={styles.cardDate}>{item.date}</Text>
        </View>
        <Ionicons 
          name={selectedId === item.id ? "chevron-up" : "chevron-down"} 
          size={16} 
          color="#6b7280" 
        />
      </View>

      {selectedId === item.id && (
        <Text style={styles.cardContent}>{item.content}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {unreadCount > 0 && (
          <View style={styles.unreadCountBadge}>
            <Text style={styles.unreadCountText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="megaphone-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No announcements yet</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  unreadCard: {
    borderColor: '#4f46e5',
    borderWidth: 1.5,
    shadowColor: '#4f46e5',
    shadowOpacity: 0.1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  unreadTitle: {
    color: '#1f2937',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4f46e5',
  },
  cardDate: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  cardContent: {
    marginTop: 12,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
  },
  unreadCountBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
  },
  unreadCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
});
