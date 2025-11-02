// Review.js
{/* Entity class for a Review in a marketplace application 
  It includes validation, serialization to/from Firestore, and JSON representation. */}
class Review {
  constructor(listingId, reviewerId, rating, comment, reviewerName, reviewerAvatar, id = null, createdAt = new Date()) {
    this.validateInputs(listingId, reviewerId, rating, reviewerName);
    
    this.id = id;
    this.listingId = listingId;
    this.reviewerId = reviewerId;
    this.rating = parseInt(rating);
    this.comment = comment?.trim() || '';
    this.reviewerName = reviewerName.trim();
    this.reviewerAvatar = reviewerAvatar || '';
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
  }
  // Input validation
  validateInputs(listingId, reviewerId, rating, reviewerName) {
    if (!listingId || typeof listingId !== 'string') {
      throw new Error('Listing ID is required and must be a string');
    }
    if (!reviewerId || typeof reviewerId !== 'string') {
      throw new Error('Reviewer ID is required and must be a string');
    }
    const numRating = parseInt(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    if (!reviewerName || typeof reviewerName !== 'string' || !reviewerName.trim()) {
      throw new Error('Reviewer name is required');
    }
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Review(
      data.listingId,
      data.reviewerId,
      data.rating,
      data.comment,
      data.reviewerName,
      data.reviewerAvatar,
      doc.id,
      data.createdAt?.toDate?.() || data.createdAt
    );
  }

  toFirestore() {
    return {
      listingId: this.listingId,
      reviewerId: this.reviewerId,
      rating: this.rating,
      comment: this.comment,
      reviewerName: this.reviewerName,
      reviewerAvatar: this.reviewerAvatar,
      createdAt: this.createdAt
    };
  }

  toJSON() {
    return {
      id: this.id,
      listingId: this.listingId,
      reviewerId: this.reviewerId,
      rating: this.rating,
      comment: this.comment,
      reviewerName: this.reviewerName,
      reviewerAvatar: this.reviewerAvatar,
      createdAt: this.createdAt
    };
  }
}

module.exports = Review;