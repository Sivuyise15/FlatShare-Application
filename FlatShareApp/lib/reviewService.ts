// lib/reviewService.ts
import {
    addDoc,
    collection,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    where
} from 'firebase/firestore';
import { firestore } from './firebaseConfig';
  
  export type Review = {
    id: string;
    listingId: string;
    userId: string; // reviewer's ID
    listingOwnerId: string; // owner of the listing being reviewed
    rating: number; // 1-5 stars
    comment: string;
    reviewerName: string;
    reviewerAvatar?: string;
    createdAt: any;
    updatedAt: any;
  };
  
  export type ListingReviewSummary = {
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: { [key: number]: number };
  };
  
  export type UserReviewSummary = {
    averageRating: number;
    totalReviews: number;
  };
  
  // Add a review for a specific listing
  export const addReview = async (
    listingId: string,
    listingOwnerId: string,
    userId: string,
    rating: number,
    comment: string,
    reviewerName: string,
    reviewerAvatar?: string
  ): Promise<string> => {
    try {
      // Prevent users from reviewing their own listings
      if (userId === listingOwnerId) {
        throw new Error("You cannot review your own listing");
      }
  
      // Check if user has already reviewed this listing
      const existingReviewQuery = query(
        collection(firestore, 'reviews'),
        where('listingId', '==', listingId),
        where('userId', '==', userId)
      );
      const existingReviews = await getDocs(existingReviewQuery);
      
      if (!existingReviews.empty) {
        throw new Error("You have already reviewed this listing");
      }
  
      const reviewData = {
        listingId,
        userId,
        listingOwnerId,
        rating,
        comment: comment.trim(),
        reviewerName,
        reviewerAvatar: reviewerAvatar || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
  
      const reviewRef = await addDoc(collection(firestore, 'reviews'), reviewData);
      
      // Update listing's review summary
      await updateListingReviewSummary(listingId);
      
      return reviewRef.id;
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  };
  
  // Get all reviews for a specific listing
  export const getListingReviews = (
    listingId: string,
    callback: (reviews: Review[]) => void
  ) => {
    const reviewsRef = collection(firestore, 'reviews');
    const q = query(
      reviewsRef, 
      where('listingId', '==', listingId),
      orderBy('createdAt', 'desc')
    );
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviews: Review[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Review, 'id'>)
      }));
      callback(reviews);
    });
  
    return unsubscribe;
  };
  
  // Get review summary for a specific listing
  export const getListingReviewSummary = async (listingId: string): Promise<ListingReviewSummary> => {
    try {
      const reviewsRef = collection(firestore, 'reviews');
      const q = query(reviewsRef, where('listingId', '==', listingId));
      const snapshot = await getDocs(q);
      
      const reviews = snapshot.docs.map(doc => doc.data());
      
      if (reviews.length === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }
      
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(review => {
        ratingBreakdown[review.rating]++;
      });
      
      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
        ratingBreakdown
      };
    } catch (error) {
      console.error('Error getting listing review summary:', error);
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
  };
  
  // Get user's overall review summary (reputation score)
  export const getUserReviewSummary = async (userId: string): Promise<UserReviewSummary> => {
    try {
      const reviewsRef = collection(firestore, 'reviews');
      const q = query(reviewsRef, where('listingOwnerId', '==', userId));
      const snapshot = await getDocs(q);
      
      const reviews = snapshot.docs.map(doc => doc.data());
      
      if (reviews.length === 0) {
        return {
          averageRating: 0,
          totalReviews: 0
        };
      }
      
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length
      };
    } catch (error) {
      console.error('Error getting user review summary:', error);
      return {
        averageRating: 0,
        totalReviews: 0
      };
    }
  };
  
  // Update listing's cached review summary in the listing document
  const updateListingReviewSummary = async (listingId: string) => {
    try {
      const summary = await getListingReviewSummary(listingId);
      
      // Find the listing document
      const listingsRef = collection(firestore, 'users', 'residents', 'listings');
      const listingDoc = doc(listingsRef, listingId);
      
      await updateDoc(listingDoc, {
        averageRating: summary.averageRating,
        totalReviews: summary.totalReviews,
        updatedAt: new Date()
      });
      
      console.log(`Updated listing ${listingId} review summary:`, summary);
    } catch (error) {
      console.error('Error updating listing review summary:', error);
    }
  };
  
  // Update user's cached review summary
  export const updateUserReviewSummary = async (userId: string) => {
    try {
      const summary = await getUserReviewSummary(userId);
      
      const userDocRef = doc(firestore, 'users', 'residents', 'details', userId);
      await updateDoc(userDocRef, {
        averageRating: summary.averageRating,
        totalReviews: summary.totalReviews,
        updatedAt: new Date()
      });
      
      console.log(`Updated user ${userId} review summary:`, summary);
    } catch (error) {
      console.error('Error updating user review summary:', error);
    }
  };