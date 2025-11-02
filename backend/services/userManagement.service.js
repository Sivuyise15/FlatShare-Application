{/* User Management Service 
    This service handles user-related operations, including CRUD operations and user status management.
    It interacts with the UserRepository for database operations and uses the Resident entity for user representation.
    It includes methods for approving, rejecting, suspending, and unsuspending users, as well as updating user profiles and gathering user statistics.
*/}

const UserRepository = require('../repositories/UserRepository');
const Resident = require('../entities/Resident');

class UserManagementService {
  constructor(db) {
    this.userRepository = new UserRepository(db);
  }

  // CRUD Operations
  async getAllUsers() {
    return await this.userRepository.findAll();
  }

  async getUserById(userId, communityName) {
    if (!communityName) {
      throw new Error('Community name is required');
    }
    const user = await this.userRepository.findById(userId, communityName);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async getUsersByStatus(status) {
    const validStatuses = ['pending', 'active', 'suspended'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status. Must be: pending, active, or suspended');
    }
    return await this.userRepository.findByStatus(status);
  }

  async getUsersByCommunity(community) {
    return await this.userRepository.findByCommunity(community);
  }

  async getUsersByCommunityAndStatus(community, status) {
    return await this.userRepository.findByCommunityAndStatus(community, status);
  }

  async searchUsers(searchTerm, community = null) {
    return await this.userRepository.searchUsers(searchTerm, community);
  }

  // User Status Management
  async approveUser(userId, communityName, adminId) {
    if (!communityName) {
      throw new Error('Community name is required');
    }
    
    const user = await this.userRepository.findById(userId, communityName);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== 'pending') {
      throw new Error('Only pending users can be approved');
    }

    user.approve(adminId);
    return await this.userRepository.update(userId, communityName, user);
  }

  async rejectUser(userId, communityName, adminId) {
    if (!communityName) {
      throw new Error('Community name is required');
    }
    
    const user = await this.userRepository.findById(userId, communityName);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== 'pending') {
      throw new Error('Only pending users can be rejected');
    }

    // Delete the user instead of just changing status
    await this.userRepository.delete(userId, communityName);
    return { success: true, message: 'User rejected and removed' };
  }

  async suspendUser(userId, communityName, adminId, reason = 'Administrative decision', durationDays = 30) {
    if (!communityName) {
      throw new Error('Community name is required');
    }
    
    const user = await this.userRepository.findById(userId, communityName);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== 'active') {
      throw new Error('Only active users can be suspended');
    }

    user.suspend(adminId, reason, durationDays);
    return await this.userRepository.update(userId, communityName, user);
  }

  async unsuspendUser(userId, communityName, adminId) {
    if (!communityName) {
      throw new Error('Community name is required');
    }
    
    const user = await this.userRepository.findById(userId, communityName);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== 'suspended') {
      throw new Error('Only suspended users can be unsuspended');
    }

    user.unsuspend(adminId);
    return await this.userRepository.update(userId, communityName, user);
  }

  async updateUserProfile(userId, communityName, profileData) {
    if (!communityName) {
      throw new Error('Community name is required');
    }
    
    const user = await this.userRepository.findById(userId, communityName);
    if (!user) {
      throw new Error('User not found');
    }

    user.updateProfile(profileData);
    return await this.userRepository.update(userId, communityName, user);
  }

  // Analytics methods to gather user statistics
  async getUserStats(community = null) {
    const users = community 
      ? await this.userRepository.findByCommunity(community)
      : await this.userRepository.findAll();

    const stats = {
      total: users.length,
      pending: users.filter(u => u.status === 'pending').length,
      active: users.filter(u => u.status === 'active').length,
      suspended: users.filter(u => u.status === 'suspended').length,
      recentJoins: users.filter(u => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(u.createdAt) > weekAgo;
      }).length
    };

    return stats;
  }

  // Helper method to get user's community from their data
  async findUserCommunity(userId) {
    try {
      // This is less efficient but necessary if you don't know the community
      const allUsers = await this.userRepository.findAll();
      const user = allUsers.find(u => u.id === userId);
      return user ? user.community : null;
    } catch (error) {
      console.error('Error finding user community:', error);
      return null;
    }
  }
}

module.exports = UserManagementService;