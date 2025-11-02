{/*
  ListingDetail.js
  This file defines the ListingDetail class which represents a listing in the application.
  It includes methods for validation, serialization, and deserialization from Firestore documents.
*/}

class ListingDetail {
  constructor(id, title, description, price, image, type, category, userId, userName, userAvatar, flatNumber, communityName, createdAt = new Date()) {
    this.validateInputs(id, title, description, userId, communityName);
    
    this.id = id;
    this.title = title.trim();
    this.description = description.trim();
    this.price = this.parsePrice(price);
    this.image = image;
    this.type = type || '';
    this.category = category || '';
    this.userId = userId;
    this.userName = userName || 'Unknown User';
    this.userAvatar = userAvatar || '';
    this.flatNumber = flatNumber || '';
    this.communityName = communityName;
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
  }

  validateInputs(id, title, description, userId, communityName) {
    if (!id || typeof id !== 'string') {
      throw new Error('Listing ID is required');
    }
    if (!title || typeof title !== 'string' || !title.trim()) {
      throw new Error('Title is required');
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      throw new Error('Description is required');
    }
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required');
    }
    if (!communityName || typeof communityName !== 'string') {
      throw new Error('Community name is required');
    }
  }

  parsePrice(price) {
    if (price === null || price === undefined || price === '') return 0;
    const parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new ListingDetail(
      doc.id,
      data.title,
      data.description,
      data.price,
      data.image,
      data.type,
      data.category,
      data.userId,
      data.userName,
      data.userAvatar,
      data.flatNumber,
      data.communityName,
      data.createdAt?.toDate?.() || data.createdAt
    );
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      price: this.price,
      image: this.image,
      type: this.type,
      category: this.category,
      userId: this.userId,
      userName: this.userName,
      userAvatar: this.userAvatar,
      flatNumber: this.flatNumber,
      communityName: this.communityName,
      createdAt: this.createdAt
    };
  }
}

module.exports = { ListingDetail };