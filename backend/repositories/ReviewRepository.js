{/*
  Review Repository
  This repository handles all database interactions related to review entities.
*/}

const BaseRepository = require('./BaseRepository');
const Review = require('../entities/Review');

class ReviewRepository extends BaseRepository {
  constructor(db) {
    super(db);
    this.reviewsRef = this.db.collection('reviews');
  }
  // Create a new review
  async create(reviewEntity) {
    if (!(reviewEntity instanceof Review)) {
      throw new Error('Invalid review entity provided');
    }

    try {
      const docRef = await this.reviewsRef.add(reviewEntity.toFirestore());
      reviewEntity.id = docRef.id;
      return reviewEntity;
    } catch (error) {
      this.handleError('create review', error);
    }
  }
  // Find a review by its ID
  async findByListingId(listingId) {
    if (!listingId || typeof listingId !== 'string') {
      throw new Error('Listing ID is required');
    }

    try {
      const snapshot = await this.reviewsRef
        .where('listingId', '==', listingId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => Review.fromFirestore(doc));
    } catch (error) {
      this.handleError('find reviews by listing', error);
    }
  }
  // Check if a review already exists for a given reviewer and listing
  async findByReviewerAndListing(reviewerId, listingId) {
    try {
      const snapshot = await this.reviewsRef
        .where('listingId', '==', listingId)
        .where('reviewerId', '==', reviewerId)
        .limit(1)
        .get();
      
      return snapshot.empty ? null : Review.fromFirestore(snapshot.docs[0]);
    } catch (error) {
      this.handleError('find existing review', error);
    }
  }

  async countByListingId(listingId) {
    try {
      const snapshot = await this.reviewsRef
        .where('listingId', '==', listingId)
        .get();
      
      return snapshot.size;
    } catch (error) {
      this.handleError('count reviews', error);
    }
  }
}

module.exports = ReviewRepository;