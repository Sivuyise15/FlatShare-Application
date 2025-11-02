{/* Entity representing an announcement in the system */}

class Announcement {
  constructor(title, message, createdAt = new Date()) {
    this.title = title;
    this.message = message;
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
  }
}

module.exports = Announcement;
