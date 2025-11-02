// backend/repositories/AnnouncementRepository.js
{/* Repository class for managing announcements in a community 
  It uses a structure similar to listings for consistency. */}

const { db } = require('../firebase');

class AnnouncementRepository {
  constructor(communityName) {
    this.communityName = communityName;
    // Use consistent structure like your listings
    this.announcementsRef = db.collection("users")
      .doc("residents")
      .collection("communities")
      .doc(communityName)
      .collection("announcements");
  }
  // Create a new announcement
  async create(announcement) {
    try {
      const docRef = await this.announcementsRef.add({ ...announcement });
      return { id: docRef.id, ...announcement };
    } catch (error) {
      console.error("Database save error:", error);
      throw new Error(`Database save failed: ${error.message}`);
    }
  }
  // Get all announcements, ordered by creation date
  async getAll() {
    try {
      const snapshot = await this.announcementsRef.orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Database fetch error:", error);
      throw new Error(`Database fetch failed: ${error.message}`);
    }
  }
}

module.exports = AnnouncementRepository;
