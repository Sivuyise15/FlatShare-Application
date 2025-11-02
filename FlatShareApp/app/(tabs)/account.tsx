import { getUserChats } from '@/lib/chatService';
import { auth, firestore as db, storage } from '@/lib/firebaseConfig';
import { getUserReviewSummary, UserReviewSummary } from '@/lib/reviewService';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, orderBy, query, setDoc, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [bio, setBio] = useState<string>('This is my bio...');
  const [isEditingBio, setIsEditingBio] = useState<boolean>(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [chatsCount, setChatsCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>({
    flatNumber: '',
    email: '',
    createdAt: ''
  });

  // NEW: Add reputation system state
  const [reviewSummary, setReviewSummary] = useState<UserReviewSummary>({
    averageRating: 0,
    totalReviews: 0
  });
  const [loadingReviews, setLoadingReviews] = useState(false);

  const currentUser = auth.currentUser;

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return;
      
      const userId = currentUser.uid;

      try {
        // Load user profile data from residents collection
        const userDocRef = doc(db, 'users', 'residents', 'details', userId);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserInfo(userData);
          if (userData.bio) setBio(userData.bio);
          if (userData.profileImage) setImage(userData.profileImage);
        }

        // Load user's listings/posts
        const listingsRef = collection(db, 'users', 'residents', 'listings');
        const listingsQuery = query(listingsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
        
        const unsubscribeListings = onSnapshot(listingsQuery, (snapshot) => {
          const userListings = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log('User listings loaded:', userListings.length);
          setPosts(userListings);
        });

        // Load user's chat count
        const unsubscribeChats = getUserChats(userId, (chats) => {
          setChatsCount(chats.length);
        });

        // NEW: Load user's review summary (reputation score)
        setLoadingReviews(true);
        const userReviewSummary = await getUserReviewSummary(userId);
        setReviewSummary(userReviewSummary);
        setLoadingReviews(false);

        // Cleanup function
        return () => {
          unsubscribeListings();
          unsubscribeChats();
        };

      } catch (error) {
        console.error('Error loading user data:', error);
        setLoadingReviews(false);
      }
    };

    loadUserData();
  }, [currentUser]);

  const handleAddPhoto = async () => {
    try {
      if (!currentUser) return;
      const userId = currentUser.uid;

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        alert('Permission denied');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (result.canceled) return;

      setLoading(true);

      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `users/residents/profiles/${userId}/${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // Save profile image to user document
      const userDocRef = doc(db, 'users', 'residents', 'details', userId);
      await setDoc(userDocRef, { profileImage: downloadURL }, { merge: true });
      setImage(downloadURL);

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBio = async () => {
    try {
      if (!currentUser) return;
      const userId = currentUser.uid;

      const userDocRef = doc(db, 'users', 'residents', 'details', userId);
      await setDoc(userDocRef, { bio }, { merge: true });
      setIsEditingBio(false);
    } catch (error) {
      console.error('Error saving bio:', error);
      alert('Failed to save bio');
    }
  };

  const navigateToChat = () => {
    router.push('/(tabs)/chat');
  };

  // NEW: Render star rating for reputation
  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={size}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

  // NEW: Get reputation level text based on rating
  const getReputationLevel = (rating: number, totalReviews: number) => {
    if (totalReviews === 0) return 'New User';
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Fair';
    return 'Needs Improvement';
  };

  const getReputationColor = (rating: number) => {
    if (rating >= 4.5) return '#4CAF50'; // Green
    if (rating >= 4.0) return '#8BC34A'; // Light Green
    if (rating >= 3.5) return '#FFC107'; // Amber
    if (rating >= 3.0) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const renderPostItem = ({ item }: { item: any }) => {
    const typeMap: Record<string, { tag: string; tagColor: string }> = {
      selling: { tag: 'Sell', tagColor: '#4f2e91' },
      renting: { tag: 'Rent', tagColor: '#320293' },
      donating: { tag: 'Donate', tagColor: '#ffe066' },
      requesting: { tag: 'Request', tagColor: '#23b3c7' },
      swapping: { tag: 'Swap', tagColor: '#4f46e5' },
      loaning: { tag: 'Loan', tagColor: '#b2e06b' },
      service: { tag: 'Service', tagColor: '#fbbf24' },
      other: { tag: 'Other', tagColor: '#8a8d9f' },
    };

    const typeKey = (item.type || '').toLowerCase();
    const typeInfo = typeMap[typeKey] || { tag: '', tagColor: '#ccc' };

    return (
      <TouchableOpacity 
        style={styles.postCard}
        onPress={() => navigation.navigate('listing-details' as never, { 
          post: JSON.stringify(item) 
        } as never)}
      >
        <View style={styles.postImageContainer}>
          {typeInfo.tag && (
            <View style={[styles.postTag, { backgroundColor: typeInfo.tagColor }]}>
              <Text style={styles.postTagText}>{typeInfo.tag}</Text>
            </View>
          )}
          {/* NEW: Display rating if available */}
          {item.averageRating > 0 && (
            <View style={styles.postRatingBadge}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.postRatingText}>{item.averageRating.toFixed(1)}</Text>
            </View>
          )}
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.postImage} />
          ) : (
            <View style={styles.noPostImage}>
              <Ionicons name="image" size={24} color="#bbb" />
            </View>
          )}
        </View>
        <View style={styles.postInfo}>
          <Text style={styles.postTitle} numberOfLines={1}>{item.title}</Text>
          {item.price > 0 && (
            <Text style={styles.postPrice}>R{item.price}</Text>
          )}
          {/* NEW: Show review count */}
          {item.totalReviews > 0 && (
            <Text style={styles.postReviews}>{item.totalReviews} reviews</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handleAddPhoto}>
            {loading ? (
              <View style={styles.avatar}>
                <ActivityIndicator size="large" color="#5B4376" />
              </View>
            ) : image ? (
              <Image source={{ uri: image }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={48} color="#bdbdbd" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.editPhoto}>Tap to change photo</Text>
        </View>

        <Text style={styles.name}>
          {userInfo.flatNumber ? `Flat ${userInfo.flatNumber}` : 'Loading...'}
        </Text>
        
        <Text style={styles.email}>{userInfo.email || currentUser?.email}</Text>
        
        {userInfo.createdAt && (
          <Text style={styles.memberSince}>
            Member since {new Date(userInfo.createdAt).toLocaleDateString()}
          </Text>
        )}

        {/* NEW: Reputation Score Section */}
        <View style={styles.reputationContainer}>
          <View style={styles.reputationHeader}>
            <Ionicons name="trophy" size={20} color="#FFD700" />
            <Text style={styles.reputationTitle}>Reputation Score</Text>
          </View>
          {loadingReviews ? (
            <ActivityIndicator size="small" color="#5B4376" />
          ) : reviewSummary.totalReviews > 0 ? (
            <View style={styles.reputationContent}>
              <View style={styles.ratingRow}>
                {renderStars(reviewSummary.averageRating, 18)}
                <Text style={styles.ratingNumber}>
                  {reviewSummary.averageRating.toFixed(1)}
                </Text>
              </View>
              <Text style={[
                styles.reputationLevel,
                { color: getReputationColor(reviewSummary.averageRating) }
              ]}>
                {getReputationLevel(reviewSummary.averageRating, reviewSummary.totalReviews)}
              </Text>
              <Text style={styles.reviewCount}>
                Based on {reviewSummary.totalReviews} review{reviewSummary.totalReviews !== 1 ? 's' : ''}
              </Text>
            </View>
          ) : (
            <View style={styles.noReputationContent}>
              <Text style={styles.noReputationText}>No reviews yet</Text>
              <Text style={styles.noReputationSubtext}>
                Start selling or renting to build your reputation!
              </Text>
            </View>
          )}
        </View>

        {/* UPDATED: Stats Container with Reviews */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={navigateToChat}>
            <Text style={styles.statNumber}>{chatsCount}</Text>
            <Text style={styles.statLabel}>Chats</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{reviewSummary.totalReviews}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>

        <View style={styles.bioContainer}>
          {isEditingBio ? (
            <>
              <TextInput 
                style={styles.bioInput} 
                value={bio} 
                onChangeText={setBio} 
                multiline
                placeholder="Tell us about yourself..."
                placeholderTextColor="#999"
              />
              <View style={styles.bioButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setIsEditingBio(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveBio}>
                  <Text style={styles.saveButtonText}>Save Bio</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.bioText}>{bio || 'No bio yet...'}</Text>
              <TouchableOpacity onPress={() => setIsEditingBio(true)}>
                <Text style={styles.editBio}>Edit Bio</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.tabContainer}>
          <Text style={styles.tabActive}>My Listings ({posts.length})</Text>
        </View>

        {posts.length > 0 ? (
          <View style={styles.postsGrid}>
            {posts.map((post) => (
              <View key={post.id} style={{ width: '48%' }}>
                {renderPostItem({ item: post })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="add-circle-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No listings yet</Text>
            <Text style={styles.emptyStateSubtext}>Create your first listing to get started!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff',
    marginBottom: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  signOutButton: {
    padding: 8,
  },
  content: { 
    alignItems: 'center', 
    padding: 20 
  },
  avatarContainer: { 
    marginTop: 16, 
    marginBottom: 16, 
    alignItems: 'center' 
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#f2f0f7', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  avatarImage: { 
    width: 100, 
    height: 100, 
    borderRadius: 50 
  },
  editPhoto: { 
    fontSize: 12, 
    color: '#666', 
    marginTop: 8 
  },
  name: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#222', 
    marginBottom: 4 
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  // NEW: Reputation system styles
  reputationContainer: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  reputationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reputationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  reputationContent: {
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  reputationLevel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
  },
  noReputationContent: {
    alignItems: 'center',
  },
  noReputationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  noReputationSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5B4376',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#ddd',
    marginHorizontal: 20,
  },
  bioContainer: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  bioText: { 
    fontSize: 14, 
    color: '#444', 
    textAlign: 'center', 
    marginBottom: 8,
    lineHeight: 20,
  },
  editBio: { 
    color: '#5B4376', 
    fontSize: 13, 
    fontWeight: '500',
  },
  bioInput: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 12, 
    width: '100%', 
    minHeight: 80, 
    textAlignVertical: 'top', 
    marginBottom: 12,
    fontSize: 14,
  },
  bioButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
  saveButton: { 
    backgroundColor: '#5B4376', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 8 
  },
  saveButtonText: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: 14,
  },
  tabContainer: { 
    width: '100%', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee', 
    marginBottom: 16,
  },
  tabActive: { 
    fontWeight: '700', 
    fontSize: 16, 
    borderBottomWidth: 2, 
    borderBottomColor: '#5B4376', 
    paddingBottom: 8, 
    color: '#222' 
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  postCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  postImageContainer: {
    position: 'relative',
    height: 120,
  },
  postTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 1,
  },
  postTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  // NEW: Post rating badge styles
  postRatingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  postRatingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noPostImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  postInfo: {
    padding: 12,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  postPrice: {
    fontSize: 12,
    color: '#5B4376',
    fontWeight: '600',
    marginBottom: 2,
  },
  // NEW: Post reviews count style
  postReviews: {
    fontSize: 10,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    width: '100%',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  createListingButton: {
    backgroundColor: '#5B4376',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createListingButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});