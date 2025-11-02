{/*
  This service handles fetching detailed information about listings.
  It serves as an intermediary between controllers and the data layer.
*/}

const ListingRepository = require('../repositories/ListingRepository');

class ListingDetailService {
  constructor(db) {
    this.db = db;
  }
  // Fetch detailed information about a specific listing by its ID and community name
  async getListingDetail(listingId, communityName) {
    if (!listingId || !communityName) {
      throw new Error('Listing ID and community name are required');
    }
    console.log(`Fetching listing detail for ID: ${listingId} in community: ${communityName}`);
    const repository = new ListingRepository(communityName);
    const listing = await repository.findById(listingId);
    
    if (!listing) {
      throw new Error('Listing not found');
    }

    return listing;
  }
  // Fetch all listings for a specific community
  async getListingsByCommunity(communityName) {
    if (!communityName) {
      throw new Error('Community name is required');
    }

    const repository = new ListingRepository(this.db, communityName);
    return await repository.findAll();
  }
}

module.exports = ListingDetailService;