{/*}
   This service handles business logic related to announcements.
    It validates input data and interacts with the AnnouncementRepository.
    It servces as an intermediary between controllers and the data layer.
*/}
const AnnouncementRepository = require('../repositories/AnnouncementRepository');
const Announcement = require('../entities/Announcement');

class AnnouncementService {
  // Create a new announcement
  static async createAnnouncement(data, communityName) {
    console.log("Creating announcement with data:", data, "for community:", communityName);
    if (!data.title || !data.message) throw new Error('Title and message are required');
    if (!communityName) throw new Error('Community name is required');
    
    const announcement = new Announcement(data.title, data.message, new Date());
    const repository = new AnnouncementRepository(communityName);
    const result = await repository.create(announcement);
    return { success: true, data: result };
  }
  // Retrieve all announcements for a community
  static async getAnnouncements(communityName) {
    if (!communityName) throw new Error('Community name is required');
    const repository = new AnnouncementRepository(communityName);
    return repository.getAll();
  }
}

module.exports = AnnouncementService;

