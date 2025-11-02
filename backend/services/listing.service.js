// backend/services/listing.service.js
{/* This service handles creating and retrieving listings, including image uploads to Firebase Storage. 
  It ensures that images are uploaded correctly and their URLs are stored in the listing data. */}
const ListingRepository = require("../repositories/ListingRepository");
const { bucket } = require("../firebase");
const { v4: uuidv4 } = require("uuid");

class ListingService {
  static async createListing(data, file) {
    let imageUrl = null;

    if (file) {
      try {
        const filename = `${uuidv4()}-${file.originalname}`;
        const fileRef = bucket.file(`users/residents/listings/${filename}`);

        await fileRef.save(file.buffer, {
          contentType: file.mimetype,
          metadata: {
            cacheControl: 'public, max-age=31536000',
          },
        });

        // Make the file publicly readable
        await fileRef.makePublic();

        // Generate the correct public URL
        imageUrl = `https://storage.googleapis.com/${bucket.name}/users/residents/listings/${filename}`;
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }
    }

    const listingData = {
      ...data,
      price: data.price ? parseFloat(data.price) : 0,
      createdAt: new Date(),
      image: imageUrl,
    };

    const repository = new ListingRepository(data.communityName);
    return await repository.save(listingData);
  }
  // Fetch all listings for a given community
  static async getListings(communityName) {
    const repository = new ListingRepository(communityName);
    return await repository.getAll();
  }
}

module.exports = ListingService;


