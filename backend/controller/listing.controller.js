// backend/controllers/listing.controller.js
{/*}
  ListingController handles HTTP requests related to property listings.
  It uses ListingService for business logic and Firestore for data storage.
  It includes methods for creating, fetching, updating, and deleting listings.
  */}
const ListingService = require('../services/listing.service');

class ListingController {
  // Create a new listing
  static async createListing(req, res) {
    console.log("=== CREATE LISTING REQUEST ===");
    console.log("Request received at:", new Date().toISOString());
    console.log("Request headers:", req.headers);
    console.log("Request body:", req.body);
    console.log("Request file:", req.file ? { 
      filename: req.file.originalname, 
      mimetype: req.file.mimetype, 
      size: req.file.size 
    } : "No file provided");
    
    try {
      const data = req.body;
      const file = req.file;

      // Validate required fields
      if (!data.communityName) {
        console.log(" Validation failed: Community name missing");
        return res.status(400).json({ error: "Community name is required" });
      }

      console.log("Validation passed, calling ListingService...");
      const listing = await ListingService.createListing(data, file);
      
      console.log("Listing created successfully:", listing);
      res.status(201).json({ 
        success: true, 
        message: "Listing created successfully",
        data: listing 
      });
    } catch (error) {
      console.error(" Error creating listing:", error);
      console.error("Error stack:", error.stack);
      
      // Return more specific error information
      res.status(500).json({ 
        error: "Failed to create listing",
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
  // Future methods: getListings, getListingById, updateListing, deleteListing
  static async getListings(req, res) {
    try {
      const { community } = req.query;
      const listings = await ListingService.getListings(community);
      res.json({ success: true, data: listings });
    } catch (error) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  }
}
module.exports = ListingController;