// ListingDetailScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { encryptedChatAPI } from "@/services/EncryptedChatAPI";
import { reportAPI } from "@/services/ReportAPI";

// Types matching backend entities
type ListingDetail = {
  id: string;
  title: string;
  description: string;
  price: number;
  image?: string;
  type: string;
  category: string;
  userId: string;
  userName: string;
  userAvatar: string;
  flatNumber: string;
  communityName: string;
  createdAt: string;
};

type Review = {
  id: string;
  listingId: string;
  reviewerId: string;
  rating: number;
  comment: string;
  reviewerName: string;
  reviewerAvatar: string;
  createdAt: string;
};

type ReviewSummary = {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: { [key: number]: number };
};

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { image } = useLocalSearchParams<{ image?: string }>();
  const imageUrl = image ? decodeURIComponent(image) : null;

  // State
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary>({
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  
  const [activeTab, setActiveTab] = useState('description');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // API Service Functions
  const apiService = {
    async getListingDetail(listingId: string): Promise<ListingDetail> {
      const token = await AsyncStorage.getItem('authToken');
      const community = await AsyncStorage.getItem('userCommunity');
      
      if (!community) {
        throw new Error('Community not found');
      }

      const response = await fetch(`https://flatshare-final.onrender.com/listings/${listingId}?community=${community}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch listing');
      }

      return result.data;
    },

    async getReviews(listingId: string): Promise<Review[]> {
      const response = await fetch(`https://flatshare-final.onrender.com/listings/${listingId}/reviews`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch reviews');
      }

      return result.data;
    },

    async getReviewSummary(listingId: string): Promise<ReviewSummary> {
      const response = await fetch(`https://flatshare-final.onrender.com/listings/${listingId}/reviews/summary`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch review summary');
      }

      return result.data;
    },

    async addReview(listingId: string, reviewData: { rating: number; comment: string; reviewerName: string; reviewerAvatar: string }): Promise<Review> {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`https://flatshare-final.onrender.com/listings/${listingId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(reviewData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add review');
      }

      return result.data;
    }
  };

  // Load listing detail and reviews
  useEffect(() => {
    if (!id) return;

    const loadListingDetail = async () => {
      try {
        setLoading(true);
        console.log('Loading listing detail for ID:', id);

        // Load listing detail
        const listingData = await apiService.getListingDetail(id);
        console.log('Listing loaded:', listingData);
        setListing(listingData);

        // Load reviews and summary concurrently
        await Promise.all([
          loadReviews(),
          loadReviewSummary()
        ]);

      } catch (error) {
        console.error('Error loading listing:', error);
        Alert.alert('Error', 'Failed to load listing details');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadListingDetail();
  }, [id]);

  const loadReviews = async () => {
    if (!id) return;

    try {
      setReviewsLoading(true);
      console.log('Loading reviews for listing:', id);
      
      const reviewsData = await apiService.getReviews(id);
      console.log('Reviews loaded:', reviewsData.length);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadReviewSummary = async () => {
    if (!id) return;

    try {
      console.log('Loading review summary for listing:', id);
      
      const summaryData = await apiService.getReviewSummary(id);
      console.log('Review summary loaded:', summaryData);
      setReviewSummary(summaryData);
    } catch (error) {
      console.error('Error loading review summary:', error);
    }
  };
  const handleSubmitReport = async () => {
    if (!id || !listing) return;

    if (!reportReason) {
      Alert.alert('Report Reason Required', 'Please provide a reason for reporting');
      return;
    }

    try {
      setSubmittingReport(true);
      console.log('Submitting report:', { reason: reportReason });

      await reportAPI.createReport({
        listingId: id,
        reason: reportReason,
        listingTitle: listing.title,
        reportedUserId: listing.userId,
        reportedUserName: listing.userName,
        reporterUserName: await AsyncStorage.getItem('userName') || 'Unknown',
        description: reportReason,
        reportType: 'listing',
      });
      Alert.alert('Success', 'Report submitted successfully!');

    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!id || !listing) return;

    if (userRating === 0) {
      Alert.alert('Rating Required', 'Please select a rating');
      return;
    }

    try {
      setSubmittingReview(true);
      console.log('Submitting review:', { rating: userRating, comment: userComment });

      // Get user info for review
      const userFlatNumber = await AsyncStorage.getItem('userFlatNumber') || 'Unknown';
      const userAvatar = await AsyncStorage.getItem('userAvatar') || '';

      const reviewData = {
        rating: userRating,
        comment: userComment.trim(),
        reviewerName: `Flat ${userFlatNumber}`,
        reviewerAvatar: userAvatar
      };

      await apiService.addReview(id, reviewData);
      
      // Reset form and close modal
      setUserRating(0);
      setUserComment('');
      setShowReviewModal(false);
      
      // Reload reviews and summary
      await Promise.all([
        loadReviews(),
        loadReviewSummary()
      ]);
      
      Alert.alert('Success', 'Review submitted successfully!');
      
    } catch (error) {
      console.error('Error submitting review:', error);
      let errorMessage = 'Failed to submit review';
      if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String((error as { message?: unknown }).message) || errorMessage;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSendMessage = async () => {
    if (!listing) return;

    const currentUserId = await AsyncStorage.getItem('userId');
    
    if (!currentUserId) {
      Alert.alert('Error', 'Please log in to send messages');
      return;
    }

    if (currentUserId === listing.userId) {
      Alert.alert('Error', 'You cannot message yourself');
      return;
    }

    const messageText = newMessage.trim() || 'Hi! Is this still available?';
    
    try {
      // Use the new sendInitialMessage method
      const result = await encryptedChatAPI.sendInitialMessage(
        listing.userId,
        messageText,
        listing.id,
        listing.title
      );
      
      // Navigate to encrypted chat room
      router.push({
        pathname: "/chat-room", // Make sure this matches your new encrypted chat room
        params: { 
          chatId: result.chatId,
          otherUser: listing.userId,
          listingId: listing.id,
          listingTitle: listing.title
        }
      });
      
      setNewMessage('');
      
    } catch (error) {
      console.error('Error sending encrypted message:', error);
      Alert.alert('Error', 'Failed to send encrypted message. Please try again.');
    }
  };

  // Render a star rating component
  const renderStars = (rating: number, size: number = 16, editable: boolean = false) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => editable && setUserRating(star)}
            disabled={!editable}
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={size}
              color="#FFD700"
              style={editable ? styles.editableStar : {}}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // NEW: Render the real reviews from Firestore
  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Image 
          source={{ uri: item.reviewerAvatar || 'https://randomuser.me/api/portraits/women/44.jpg' }} 
          style={styles.reviewAvatar} 
        />
        <View style={styles.reviewUserInfo}>
          <Text style={styles.reviewUserName}>{item.reviewerName}</Text>
          {renderStars(item.rating)}
        </View>
        <Text style={styles.reviewDate}>
          {item.createdAt
            ? new Date(item.createdAt).toLocaleDateString()
            : 'Recently'
          }
        </Text>
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );

  // NEW: Render rating breakdown
  const renderRatingBreakdown = () => (
    <View style={styles.ratingBreakdown}>
      {[5, 4, 3, 2, 1].map((rating) => (
        <View key={rating} style={styles.ratingRow}>
          <Text style={styles.ratingRowText}>{rating}</Text>
          <Ionicons name="star" size={12} color="#FFD700" />
          <View style={styles.ratingBar}>
            <View 
              style={[
                styles.ratingBarFill, 
                { width: `${reviewSummary.totalReviews > 0 ? (reviewSummary.ratingBreakdown[rating] / reviewSummary.totalReviews) * 100 : 0}%` }
              ]} 
            />
          </View>
          <Text style={styles.ratingCount}>({reviewSummary.ratingBreakdown[rating]})</Text>
        </View>
      ))}
    </View>
  );

  // Render the appropriate content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "description":
        return (
          <View style={styles.tabContent}>
            <Text style={styles.description}>{listing?.description || "No description available"}</Text>
          </View>
        );
      case "review":
        return (
          <View style={styles.tabContent}>
            <View style={styles.reviewsHeader}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: -15 }}>
                {/* Add Review button */}
                <TouchableOpacity 
                  style={styles.addReviewButton}
                  onPress={() => setShowReviewModal(true)}
                >
                  <Text style={styles.addReviewButtonText}>Add Review</Text>
                </TouchableOpacity>
                {/* Report button */}
                <TouchableOpacity 
                  style={styles.addReviewButton}
                  onPress={() => setShowReportModal(true)}
                >
                  <Text style={styles.addReviewButtonText}>Report Listing</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.reviewsSummary}>
                <Text style={styles.reviewsTitle}>Customer Reviews</Text>
                <View style={styles.ratingSummary}>
                  {renderStars(reviewSummary.averageRating, 20)}
                  <Text style={styles.ratingText}>
                    {reviewSummary.averageRating.toFixed(1)} • {reviewSummary.totalReviews} reviews
                  </Text>
                </View>
                {reviewSummary.totalReviews > 0 && renderRatingBreakdown()}
              </View>
              
            </View>
            
            {reviews.length > 0 ? (
              <FlatList
                data={reviews}
                keyExtractor={(item) => item.id}
                renderItem={renderReviewItem}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.reviewSeparator} />}
              />
            ) : (
              <View style={styles.noReviews}>
                <Ionicons name="chatbubble-outline" size={48} color="#ddd" />
                <Text style={styles.noReviewsText}>No reviews yet</Text>
                <Text style={styles.noReviewsSubtext}>Be the first to share your experience!</Text>
              </View>
            )}
          </View>
        );
      case "same":
        return (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoon}>Same products feature coming soon!</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          {/* User Profile in Top Right Corner */}
          <TouchableOpacity 
            style={styles.topRightProfile}
            onPress={() => router.push({
              pathname: "/(tabs)/account",
            })}
          >
            <Image 
              source={{ uri: listing?.userAvatar || 'https://randomuser.me/api/portraits/women/44.jpg' }} 
              style={styles.topRightAvatar}
            />
          </TouchableOpacity>
        </View>

        {/* Product Image */}
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.productImage} 
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="image" size={60} color="#bbb" />
              <Text style={styles.noImageText}>No Image Available</Text>
            </View>
          )}
        </View>

        {/* Product Info Card */}
        <View style={styles.card}>
          {/* Title and Price */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{listing?.title || "Untitled Product"}</Text>
            {listing?.price && (
              <Text style={styles.price}>R{listing.price}</Text>
            )}
          </View>

          {/* NEW: Rating Display */}
          {reviewSummary.totalReviews > 0 && (
            <View style={styles.productRatingRow}>
              {renderStars(reviewSummary.averageRating, 16)}
              <Text style={styles.productRatingText}>
                {reviewSummary.averageRating.toFixed(1)} ({reviewSummary.totalReviews} reviews)
              </Text>
            </View>
          )}

          {/* Tabs Row */}
          <View style={styles.tabsRow}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === "description" && styles.activeTab]} 
              onPress={() => setActiveTab("description")}
            >
              <Text style={[styles.tabText, activeTab === "description" && styles.activeTabText]}>
                Description
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === "review" && styles.activeTab]} 
              onPress={() => setActiveTab("review")}
            >
              <Text style={[styles.tabText, activeTab === "review" && styles.activeTabText]}>
                Reviews ({reviewSummary.totalReviews})
              </Text>
            </TouchableOpacity>
            
          </View>

          {/* Tab Content */}
          {renderTabContent()}
        </View>
      </ScrollView>

      {/* Bottom Input Row */}
      <View style={styles.messageRow}>
        <TextInput
          style={styles.messageInput}
          placeholder="Hi! Product still available?"
          placeholderTextColor="#999"
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity 
          style={styles.sendButton}
          onPress={handleSendMessage}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Content</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Reason Section */}
            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>Reason for Report *</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Describe the issue (e.g., spam, inappropriate, etc.)"
                placeholderTextColor="#999"
                multiline={true}
                numberOfLines={4}
                value={reportReason}
                onChangeText={setReportReason}
                maxLength={500}
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!reportReason || submittingReport) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitReport}
              disabled={!reportReason || submittingReport}
            >
              <Text style={styles.submitButtonText}>
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Your Review</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Your Rating *</Text>
              {renderStars(userRating, 28, true)}
            </View>
            
            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>Your Comment (Optional)</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Share your experience with this product..."
                placeholderTextColor="#999"
                multiline={true}
                numberOfLines={4}
                value={userComment}
                onChangeText={setUserComment}
                maxLength={500}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.submitButton, (!userRating || submittingReview) && styles.submitButtonDisabled]}
              onPress={handleSubmitReview}
              disabled={!userRating || submittingReview}
            >
              <Text style={styles.submitButtonText}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  noImageContainer: {
    width: "100%",
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  noImageText: {
    color: '#bbb', 
    marginTop: 8,
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: { 
    fontSize: 22, 
    fontWeight: "bold", 
    color: "#333",
    flex: 1,
    marginRight: 16,
  },
  price: { 
    fontSize: 22, 
    fontWeight: "bold", 
    color: "#4B0082",
    minWidth: 80,
    textAlign: 'right',
  },
  // NEW: Product rating display
  productRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  productRatingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  ratingRow: { 
    flexDirection: "row", 
    alignItems: "center",
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  editableStar: {
    marginHorizontal: 2,
  },
  ratingCount: {
    color: "#666",
    fontSize: 14,
  },
  userInfoSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  postedBy: {
    fontSize: 12,
    color: "#666",
  },
  userName: {
    fontSize: 12,
    color: "#4B0082",
    fontWeight: "500",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  topRightProfile: {
    backgroundColor: "#fff",
    padding: 4,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  topRightAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eee',
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  quantityLabel: {
    fontSize: 16,
    color: "#666",
    marginRight: 12,
  },
  qtyButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    backgroundColor: "#f1f1f1",
  },
  qtyButtonAdd: { 
    backgroundColor: "#4B0082", 
    borderColor: "#4B0082" 
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 15,
    color: "#333",
    minWidth: 30,
    textAlign: "center",
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    paddingBottom: 12,
    flex: 1,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#4B0082",
  },
  activeTabText: {
    color: "#4B0082",
    fontWeight: "bold",
  },
  tabContent: {
    paddingVertical: 16,
    minHeight: 200,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#555",
  },
  comingSoon: {
    textAlign: "center",
    color: "#999",
    fontSize: 16,
    marginTop: 40,
  },
  reviewsHeader: {
    marginBottom: 20,
  },
  reviewsSummary: {
    marginBottom: 16,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  ratingSummary: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  ratingText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
  },
  // NEW: Rating breakdown styles
  ratingBreakdown: {
    marginTop: 8,
  },
  ratingRowText: {
    fontSize: 12,
    color: "#666",
    width: 12,
  },
  ratingBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 2,
    marginLeft: 8,
    marginRight: 8,
  },
  ratingBarFill: {
    height: "100%",
    backgroundColor: "#FFD700",
    borderRadius: 2,
  },
  addReviewButton: {
    backgroundColor: "#4B0082",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  addReviewButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
  reviewItem: {
    paddingVertical: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: "#999",
  },
  reviewComment: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  reviewSeparator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },
  noReviews: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noReviewsText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
    marginBottom: 4,
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: "#bbb",
    textAlign: "center",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  messageInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginRight: 10,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: "#4B0082",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
    fontWeight: "500",
  },
  commentSection: {
    marginBottom: 24,
  },
  commentLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#4B0082",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});