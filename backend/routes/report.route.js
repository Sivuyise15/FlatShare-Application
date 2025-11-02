// backend/routes/report.routes.js
const express = require('express');
const ReportController = require('../controller/report.controller');
const authMiddleware = require('../middleware/auth');
const { db } = require('../firebase');

const router = express.Router();
const controller = new ReportController(db);

// All routes require authentication
router.use(authMiddleware);

// Create a new report
router.post('/', controller.createReport.bind(controller));

// Get all reports (admin only - add admin middleware if needed)
router.get('/', controller.getAllReports.bind(controller));

// Get report statistics
router.get('/stats', controller.getReportStats.bind(controller));

// Get specific report
router.get('/:id', controller.getReportById.bind(controller));

// Get reports for specific listing
router.get('/listing/:listingId', controller.getReportsByListing.bind(controller));

// Admin actions
router.post('/:id/resolve', controller.resolveReport.bind(controller));
router.post('/:id/reject', controller.rejectReport.bind(controller));

module.exports = router;