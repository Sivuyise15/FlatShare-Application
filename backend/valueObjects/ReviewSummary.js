
{/**
 * ReviewSummary Value Object
 * 
 * This class encapsulates the summary of reviews for a product or service.
 * It calculates average rating, total number of reviews, and rating breakdown.
 */
}
class ReviewSummary {
  constructor(reviews = []) {
    this.reviews = reviews;
    this.calculateMetrics();
  }
  // Calculate average rating, total reviews, and rating breakdown
  calculateMetrics() {
    if (this.reviews.length === 0) {
      this.averageRating = 0;
      this.totalReviews = 0;
      this.ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; // Initialize rating breakdown
      return;
    }

    this.totalReviews = this.reviews.length;
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = Math.round((totalRating / this.totalReviews) * 10) / 10;
    
    this.ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    this.reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        this.ratingBreakdown[review.rating]++;
      }
    });
  }
  // Convert the summary to a JSON object
  toJSON() {
    return {
      averageRating: this.averageRating,
      totalReviews: this.totalReviews,
      ratingBreakdown: this.ratingBreakdown
    };
  }
}

module.exports = ReviewSummary;