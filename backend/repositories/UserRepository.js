// backend/repositories/UserRepository.js

{/* User Repository
    This repository handles all database interactions related to user entities.
*/}
// backend/repositories/UserRepository.js
const BaseRepository = require('./BaseRepository');
const Resident = require('../entities/Resident');

class UserRepository extends BaseRepository {
  constructor(db) {
    super(db);
    this.db = db;
    this.usersRef = this.db.collection('users')
      .doc('residents')
      .collection('communities');
  }
  // Find user by ID within a specific community
  async findById(userId, communityName) {
    if (!userId || !communityName) {
      throw new Error('User ID and community name are required');
    }

    try {
      const doc = await this.usersRef
        .doc(communityName)
        .collection('details')
        .doc(userId)
        .get();
        
      if (!doc.exists) {
        return null;
      }
      
      return Resident.fromFirestore(doc);
    } catch (error) {
      this.handleError('find user by ID', error);
    }
  }
  // Retrieve all users across all communities
  async findAll() {
    try {
      const communities = await this.usersRef.get();
      const allUsers = [];

      for (const communityDoc of communities.docs) {
        const communityName = communityDoc.id;
        const usersSnapshot = await this.usersRef
          .doc(communityName)
          .collection('details')
          .get();
        
        const communityUsers = usersSnapshot.docs.map(doc => Resident.fromFirestore(doc));
        allUsers.push(...communityUsers);
      }

      // Sort by creation date
      return allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      this.handleError('find all users', error);
    }
  }
  // Find users by status across all communities
  async findByStatus(status) {
    if (!status) {
      throw new Error('Status is required');
    }

    try {
      console.log('Searching for status:', status);
      const communities = await this.usersRef.get();
      const matchingUsers = [];

      for (const communityDoc of communities.docs) {
        const communityName = communityDoc.id;
        console.log('Checking community:', communityName);
        
        const usersSnapshot = await this.usersRef
          .doc(communityName)
          .collection('details')
          .where('status', '==', status)
          .get();
        
        console.log(`Found ${usersSnapshot.docs.length} users with status ${status} in ${communityName}`);
        
        const communityUsers = usersSnapshot.docs.map(doc => Resident.fromFirestore(doc));
        matchingUsers.push(...communityUsers);
      }

      return matchingUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      this.handleError('find users by status', error);
    }
  }
  // Find users by community
  async findByCommunity(community) {
    if (!community) {
      throw new Error('Community is required');
    }

    try {
      console.log('Searching in community:', community);
      
      const usersSnapshot = await this.usersRef
        .doc(community)
        .collection('details')
        .get();
      
      console.log(`Found ${usersSnapshot.docs.length} users in community ${community}`);
      
      // Log some sample data
      usersSnapshot.docs.slice(0, 2).forEach((doc, index) => {
        const data = doc.data();
        console.log(`Sample user ${index}:`, {
          id: doc.id,
          email: data.email,
          status: data.status,
          community: data.community
        });
      });
      
      const users = usersSnapshot.docs.map(doc => Resident.fromFirestore(doc));
      return users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      this.handleError('find users by community', error);
    }
  }
  // Find users by both community and status
  async findByCommunityAndStatus(community, status) {
    if (!community || !status) {
      throw new Error('Both community and status are required');
    }

    try {
      console.log('Searching for community:', community, 'status:', status);
      
      const usersSnapshot = await this.usersRef
        .doc(community)
        .collection('details')
        .where('status', '==', status)
        .get();
      
      console.log(`Found ${usersSnapshot.docs.length} users with status ${status} in community ${community}`);
      
      // Log sample results
      usersSnapshot.docs.slice(0, 2).forEach((doc, index) => {
        const data = doc.data();
        console.log(`Match ${index}:`, {
          id: doc.id,
          email: data.email,
          status: data.status,
          community: data.community,
          flatNumber: data.flatNumber
        });
      });
      
      const users = usersSnapshot.docs.map(doc => Resident.fromFirestore(doc));
      return users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      this.handleError('find users by community and status', error);
    }
  }
  // Create a new user within a specific community
  async update(userId, communityName, residentEntity) {
    if (!(residentEntity instanceof Resident)) {
      throw new Error('Invalid resident entity provided');
    }

    try {
      await this.usersRef
        .doc(communityName)
        .collection('details')
        .doc(userId)
        .update(residentEntity.toFirestore());
        
      residentEntity.id = userId;
      return residentEntity;
    } catch (error) {
      this.handleError('update user', error);
    }
  }
  // Delete a user from a specific community
  async delete(userId, communityName) {
    if (!userId || !communityName) {
      throw new Error('User ID and community name are required');
    }

    try {
      await this.usersRef
        .doc(communityName)
        .collection('details')
        .doc(userId)
        .delete();
      return true;
    } catch (error) {
      this.handleError('delete user', error);
    }
  }
  // Search users by term across all communities or within a specific community
  async searchUsers(searchTerm, community = null) {
    try {
      let users = [];
      
      if (community) {
        // Search within specific community
        const usersSnapshot = await this.usersRef
          .doc(community)
          .collection('details')
          .get();
        users = usersSnapshot.docs.map(doc => Resident.fromFirestore(doc));
      } else {
        // Search across all communities
        users = await this.findAll();
      }
      
      if (!searchTerm) {
        return users;
      }
      
      const lowercaseSearch = searchTerm.toLowerCase();
      return users.filter(user => 
        user.email.toLowerCase().includes(lowercaseSearch) ||
        user.flatNumber.toLowerCase().includes(lowercaseSearch) ||
        user.name.toLowerCase().includes(lowercaseSearch) ||
        user.surname.toLowerCase().includes(lowercaseSearch) ||
        user.id.toLowerCase().includes(lowercaseSearch)
      );
    } catch (error) {
      this.handleError('search users', error);
    }
  }
}

module.exports = UserRepository;