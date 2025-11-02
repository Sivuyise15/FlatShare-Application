{/* ReviewService.js 
  This service handles adding reviews, fetching reviews for a listing,
  and generating review summaries.
  It ensures no duplicate reviews from the same user for a listing.
  It incorporates validation through the Review entity and summary generation via ReviewSummary.
  */}

const ReviewRepository = require('../repositories/ReviewRepository');
const Review = require('../entities/Review');
const ReviewSummary = require('../valueObjects/ReviewSummary');

class ReviewService {
  constructor(db) {
    this.reviewRepository = new ReviewRepository(db);
  }
  // Add a new review
  async addReview(listingId, reviewerId, reviewData) {
    // Check for duplicate review
    const existingReview = await this.reviewRepository.findByReviewerAndListing(reviewerId, listingId);
    if (existingReview) {
      throw new Error('You have already reviewed this listing');
    }

    // Create and validate review entity
    const review = new Review(
      listingId,
      reviewerId,
      reviewData.rating,
      reviewData.comment,
      reviewData.reviewerName,
      reviewData.reviewerAvatar
    );

    // Save to repository
    return await this.reviewRepository.create(review);
  }
  // Fetch reviews for a specific listing
  async getReviewsByListingId(listingId) {
    return await this.reviewRepository.findByListingId(listingId);
  }
  // Generate review summary for a listing
  async getReviewSummary(listingId) {
    const reviews = await this.reviewRepository.findByListingId(listingId);
    const summary = new ReviewSummary(reviews);
    return summary.toJSON();
  }
}

module.exports = ReviewService;