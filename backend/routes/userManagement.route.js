// backend/routes/userManagement.routes.js
{/* User Management Routes
    This file defines the routes for user management operations, including CRUD and status management.
*/}
const express = require('express');
const UserManagementController = require('../controller/userManagement.controller');
const authMiddleware = require('../middleware/auth');
const { db } = require('../firebase');

const router = express.Router();
const controller = new UserManagementController(db);

// All routes require authentication
router.use(authMiddleware);

// Get all users with filtering options
router.get('/', controller.getAllUsers.bind(controller));

// Get user statistics
router.get('/stats', controller.getUserStats.bind(controller));

// Get specific user (requires community query parameter)
router.get('/:id', controller.getUserById.bind(controller));

// User management actions (requires community in request body or query)
router.post('/:id/approve', controller.approveUser.bind(controller));
router.delete('/:id/reject', controller.rejectUser.bind(controller));
router.post('/:id/suspend', controller.suspendUser.bind(controller));
router.post('/:id/unsuspend', controller.unsuspendUser.bind(controller));

module.exports = router;
