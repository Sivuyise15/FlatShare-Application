
//backend/controller/userManagement.controller.js
{/* User Management Controller
    This controller handles HTTP requests related to user management operations by administrators.
*/}
const UserManagementService = require('../services/userManagement.service');

class UserManagementController {
  constructor(db) {
    this.userService = new UserManagementService(db);
  }

  // CRUD Operations
  async getAllUsers(req, res) {
    try {
      const { community, status, search } = req.query;
      let users;

      console.log('Query params:', { community, status, search });

      if (search) {
        users = await this.userService.searchUsers(search, community);
      } else if (community && status) {
        // Handle both filters together
        users = await this.userService.getUsersByCommunityAndStatus(community, status);
      } else if (status) {
        users = await this.userService.getUsersByStatus(status);
      } else if (community) {
        users = await this.userService.getUsersByCommunity(community);
      } else {
        users = await this.userService.getAllUsers();
      }

      console.log('Found users:', users.length);

      res.json({
        success: true,
        data: users.map(user => user.toJSON())
      });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  // Get user by ID with community context
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const { community } = req.query;

      if (!community) {
        return res.status(400).json({ 
          success: false, 
          error: 'Community parameter is required' 
        });
      }

      const user = await this.userService.getUserById(id, community);
      
      res.json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      console.error('Error getting user:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({ success: false, error: error.message });
      }
      
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // User Status Management
  async approveUser(req, res) {
    try {
      const { id } = req.params;
      const { community } = req.body;
      const adminId = req.user?.uid;

      if (!adminId) {
        return res.status(401).json({ success: false, error: 'Admin authentication required' });
      }

      if (!community) {
        return res.status(400).json({ 
          success: false, 
          error: 'Community parameter is required in request body' 
        });
      }

      const user = await this.userService.approveUser(id, community, adminId);
      
      res.json({
        success: true,
        message: 'User approved successfully',
        data: user.toJSON()
      });
    } catch (error) {
      console.error('Error approving user:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  // Reject user and remove from community
  async rejectUser(req, res) {
    try {
      const { id } = req.params;
      const { community } = req.body;
      const adminId = req.user?.uid;

      if (!adminId) {
        return res.status(401).json({ success: false, error: 'Admin authentication required' });
      }

      if (!community) {
        return res.status(400).json({ 
          success: false, 
          error: 'Community parameter is required in request body' 
        });
      }

      await this.userService.rejectUser(id, community, adminId);
      
      res.json({
        success: true,
        message: 'User rejected and removed successfully'
      });
    } catch (error) {
      console.error('Error rejecting user:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  // Suspend user with reason and duration
  async suspendUser(req, res) {
    try {
      const { id } = req.params;
      const { community, reason, durationDays } = req.body;
      const adminId = req.user?.uid;

      if (!adminId) {
        return res.status(401).json({ success: false, error: 'Admin authentication required' });
      }

      if (!community) {
        return res.status(400).json({ 
          success: false, 
          error: 'Community parameter is required in request body' 
        });
      }

      const user = await this.userService.suspendUser(id, community, adminId, reason, durationDays);
      
      res.json({
        success: true,
        message: 'User suspended successfully',
        data: user.toJSON()
      });
    } catch (error) {
      console.error('Error suspending user:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  // Unsuspend user
  async unsuspendUser(req, res) {
    try {
      const { id } = req.params;
      const { community } = req.body;
      const adminId = req.user?.uid;

      if (!adminId) {
        return res.status(401).json({ success: false, error: 'Admin authentication required' });
      }

      if (!community) {
        return res.status(400).json({ 
          success: false, 
          error: 'Community parameter is required in request body' 
        });
      }

      const user = await this.userService.unsuspendUser(id, community, adminId);
      
      res.json({
        success: true,
        message: 'User unsuspended successfully',
        data: user.toJSON()
      });
    } catch (error) {
      console.error('Error unsuspending user:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Analytics methods to gather user statistics
  async getUserStats(req, res) {
    try {
      const { community } = req.query;
      const stats = await this.userService.getUserStats(community);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = UserManagementController;