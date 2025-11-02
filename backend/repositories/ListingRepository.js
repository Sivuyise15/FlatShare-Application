// backend/repositories/ListingRepository.js
{/* This repository manages listings within specific communities.
    It provides methods to create, retrieve, and manage listings.
  */}
const { db } = require('../firebase');
const { ListingDetail } = require('../entities/ListingDetail');

class ListingRepository {
  constructor(communityName) {
    console.log(`Initializing ListingRepository for community: ${communityName}`);
    this.communityName = communityName;
    this.listingsRef = db.collection("users")
      .doc("residents")
      .collection("communities")
      .doc(communityName)
      .collection("listings");
  }

  validateCommunityName(communityName) {
    if (!communityName || typeof communityName !== 'string') {
      throw new Error('Community name is required');
    }
  }

  async save(listing) {
    try {
      const docRef = await this.listingsRef.add({ ...listing });
      return { id: docRef.id, ...listing };
    } catch (error) {
      console.error("Database save error:", error);
      throw new Error(`Database save failed: ${error.message}`);
    }
  }
  // Future methods: findAll, findById, update, delete
  async getAll() {
    const snapshot = await this.listingsRef.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));
  }
  // Find a listing by its ID
  async findById(listingId) {
    console.log(`Finding listing by ID: ${listingId} in community: ${this.communityName}`);
    if (!listingId || typeof listingId !== 'string') {
      throw new Error('Listing ID is required');
    }

    try {
      const doc = await this.listingsRef.doc(listingId).get();
      if (!doc.exists) {
        console.warn(`Listing with ID ${listingId} not found in community ${this.communityName}`);
        return null;
      }
      
      return ListingDetail.fromFirestore(doc);
    } catch (error) {
      this.handleError('find listing by ID', error);
    }
  }
  // Retrieve all listings in the community
  async findAll() {
    try {
      const snapshot = await this.listingsRef
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ListingDetail.fromFirestore(doc));
    } catch (error) {
      this.handleError('find all listings', error);
    }
  }
  //handle errors uniformly
  handleError(action, error) {
    console.error(`Firestore error in ListingRepository during ${action}:`, error.message);
    throw error; // rethrow so service/controller can catch
  }
} 

module.exports = ListingRepository;