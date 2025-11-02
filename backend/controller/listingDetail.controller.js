// backend/controller/listingDetail.controller.js
{/*
  Controller for handling listing details and reviews.
  Provides endpoints to get listing details, add reviews, and fetch reviews and summaries.
  Includes error handling and logging.
*/}

const ListingDetailService = require('../services/listingDetail.service');
const ReviewService = require('../services/review.service');

class ListingDetailController {
  constructor(db) {
    this.listingDetailService = new ListingDetailService(db);
    this.reviewService = new ReviewService(db);
  }
  // Get listing detail by ID and community
  async getListingDetail(req, res) {
    try {
      const { id } = req.params;
      const { community } = req.query;

      console.log(`Getting listing detail - ID: ${id}, Community: ${community}`);

      if (!community) {
        return res.status(400).json({ 
          success: false, 
          error: 'Community parameter is required' 
        });
      }

      const listing = await this.listingDetailService.getListingDetail(id, community);
      
      res.json({
        success: true,
        data: listing.toJSON()
      });
    } catch (error) {
      console.error('Error getting listing detail:', error);
      
      if (error.message === 'Listing not found') {
        return res.status(404).json({
          success: false,
          error: 'Listing not found'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  // Add a review for a listing
  async addReview(req, res) {
    try {
      const { id: listingId } = req.params;
      const reviewData = req.body;
      
      // Get reviewer ID from auth middleware (assuming req.user is set)
      const reviewerId = req.user?.uid || req.user?.id;
      if (!reviewerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      console.log(`Adding review - Listing: ${listingId}, Reviewer: ${reviewerId}`);

      const review = await this.reviewService.addReview(listingId, reviewerId, reviewData);
      
      res.status(201).json({
        success: true,
        data: review.toJSON()
      });
    } catch (error) {
      console.error('Error adding review:', error);
      
      if (error.message.includes('already reviewed')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  // Get all reviews for a listing
  async getReviews(req, res) {
    try {
      const { id: listingId } = req.params;
      
      console.log(`Getting reviews for listing: ${listingId}`);

      const reviews = await this.reviewService.getReviewsByListingId(listingId);
      
      res.json({
        success: true,
        data: reviews.map(review => review.toJSON())
      });
    } catch (error) {
      console.error('Error getting reviews:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  // Get review summary for a listing
  async getReviewSummary(req, res) {
    try {
      const { id: listingId } = req.params;
      
      console.log(`Getting review summary for listing: ${listingId}`);

      const summary = await this.reviewService.getReviewSummary(listingId);
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting review summary:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = ListingDetailController;
