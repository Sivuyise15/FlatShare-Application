// backend/controller/announcement.controller.js
{/* This file handles HTTP requests related to announcements. 
  It uses AnnouncementService to perform business logic. 
  It supports fetching and creating announcements,
  with community context passed via query parameters.
  */}

const AnnouncementService = require('../services/announcement.service');

class AnnouncementController {

  // Fetch announcements for a specific community
  static async getAnnouncements(req, res) {
    try {
      const { community } = req.query; // Get community from query params
      const announcements = await AnnouncementService.getAnnouncements(community);
      res.status(200).json({ success: true, data: announcements });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
 // Create a new announcement in a specific community
  static async createAnnouncement(req, res) {
    try {
      const { community } = req.query; // Or get from req.body
      const result = await AnnouncementService.createAnnouncement(req.body, community);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = AnnouncementController;
