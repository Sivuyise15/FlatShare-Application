// backend/entities/EncryptedChat.js
{/*
  Represents an encrypted chat between two users.
  Each chat is associated with a unique encryption key hash for identification.
*/}
class EncryptedChat {
  constructor(participants, listingId, listingTitle, keyHash, createdAt = new Date(), id = null) {
    this.validateInputs(participants, keyHash);
    
    this.id = id;
    this.participants = participants;
    this.listingId = listingId || null;
    this.listingTitle = listingTitle || null;
    this.keyHash = keyHash; // Hash of the encryption key for identification
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
    this.lastMessage = null;
    this.lastActivity = createdAt;
  }
  //  Validates the inputs for the constructor
  validateInputs(participants, keyHash) {
    if (!participants || !Array.isArray(participants) || participants.length !== 2) {
      throw new Error('Exactly two participants are required');
    }
    if (!keyHash || typeof keyHash !== 'string') {
      throw new Error('Key hash is required');
    }
  }
  // Factory method to create an EncryptedChat instance from Firestore document
  static fromFirestore(doc) {
    const data = doc.data();
    return new EncryptedChat(
      data.participants,
      data.listingId,
      data.listingTitle,
      data.keyHash,
      data.createdAt?.toDate?.() || data.createdAt,
      doc.id
    );
  }
  // Converts the instance to a Firestore-compatible object
  toFirestore() {
    return {
      participants: this.participants,
      listingId: this.listingId,
      listingTitle: this.listingTitle,
      keyHash: this.keyHash,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity
    };
  }

  toJSON() {
    return {
      id: this.id,
      participants: this.participants,
      listingId: this.listingId,
      listingTitle: this.listingTitle,
      keyHash: this.keyHash,
      createdAt: this.createdAt,
      lastMessage: this.lastMessage,
      lastActivity: this.lastActivity
    };
  }
}

module.exports = EncryptedChat;