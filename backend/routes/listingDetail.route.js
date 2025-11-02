// backend/routes/listingDetail.routes.js
const express = require('express');
const ListingDetailController = require('../controller/listingDetail.controller');
const { db } = require('../firebase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const controller = new ListingDetailController(db);

// Get listing detail (public - no auth required)
router.get('/:id', controller.getListingDetail.bind(controller));

// Get reviews (public - no auth required)
router.get('/:id/reviews', controller.getReviews.bind(controller));

// Get review summary (public - no auth required)
router.get('/:id/reviews/summary', controller.getReviewSummary.bind(controller));

// Add review (requires authentication)
router.post('/:id/reviews', authMiddleware, controller.addReview.bind(controller));

module.exports = router;