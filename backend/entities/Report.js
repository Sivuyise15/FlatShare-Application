// backend/entities/Report.js
{/*
  Entity representing a user report in the marketplace application.
  A report can be about a listing, a user, or a chat interaction.
  It includes details about the report, its status, and any admin actions taken.
*/}
class Report {
  constructor(listingId, listingTitle, reportedUserId, reportedUserName, reporterUserId, reporterUserName, reason, description, reportType = 'listing') {
    this.validateInputs(listingId, reportedUserId, reporterUserId, reason, description);
    
    this.listingId = listingId;
    this.listingTitle = listingTitle || 'Unknown Listing';
    this.reportedUserId = reportedUserId;
    this.reportedUserName = reportedUserName;
    this.reporterUserId = reporterUserId;
    this.reporterUserName = reporterUserName;
    this.reason = reason;
    this.description = description.trim();
    this.reportType = reportType; // 'listing', 'user', 'chat'
    this.timestamp = new Date();
    this.status = 'pending'; // 'pending', 'resolved', 'rejected'
    
    // Admin review fields
    this.adminNotes = null;
    this.reviewedBy = null;
    this.reviewedAt = null;
    
    // Action taken fields
    this.actionTaken = null; // 'listing_removed', 'user_suspended', 'warning_issued', 'no_action'
  }
  // Validate required inputs
  validateInputs(listingId, reportedUserId, reporterUserId, reason, description) {
    if (!listingId || typeof listingId !== 'string') {
      throw new Error('Listing ID is required');
    }
    if (!reportedUserId || typeof reportedUserId !== 'string') {
      throw new Error('Reported user ID is required');
    }
    if (!reporterUserId || typeof reporterUserId !== 'string') {
      throw new Error('Reporter user ID is required');
    }
    if (!reason || typeof reason !== 'string') {
      throw new Error('Reason is required');
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      throw new Error('Description is required');
    }
    if (reportedUserId === reporterUserId) {
      throw new Error('Users cannot report their own listings');
    }
  }
  // Admin actions
  resolve(adminId, notes = '', actionTaken = 'no_action') {
    this.status = 'resolved';
    this.reviewedBy = adminId;
    this.reviewedAt = new Date();
    this.adminNotes = notes.trim();
    this.actionTaken = actionTaken;
    return this;
  }
  // Admin rejects the report
  reject(adminId, notes = '') {
    this.status = 'rejected';
    this.reviewedBy = adminId;
    this.reviewedAt = new Date();
    this.adminNotes = notes.trim();
    this.actionTaken = 'no_action';
    return this;
  }
  // Serialization methods
  static fromFirestore(doc) {
    const data = doc.data();
    const report = new Report(
      data.listingId,
      data.listingTitle,
      data.reportedUserId,
      data.reportedUserName,
      data.reporterUserId,
      data.reporterUserName,
      data.reason,
      data.description,
      data.reportType
    );

    // Set additional properties
    report.id = doc.id;
    report.timestamp = data.timestamp?.toDate?.() || data.timestamp || new Date();
    report.status = data.status || 'pending';
    report.adminNotes = data.adminNotes || null;
    report.reviewedBy = data.reviewedBy || null;
    report.reviewedAt = data.reviewedAt?.toDate?.() || data.reviewedAt;
    report.actionTaken = data.actionTaken || null;

    return report;
  }

  toFirestore() {
    const data = {
      listingId: this.listingId,
      listingTitle: this.listingTitle,
      reportedUserId: this.reportedUserId,
      reportedUserName: this.reportedUserName,
      reporterUserId: this.reporterUserId,
      reporterUserName: this.reporterUserName,
      reason: this.reason,
      description: this.description,
      reportType: this.reportType,
      timestamp: this.timestamp,
      status: this.status
    };

    // Only add non-null fields
    if (this.adminNotes) data.adminNotes = this.adminNotes;
    if (this.reviewedBy) data.reviewedBy = this.reviewedBy;
    if (this.reviewedAt) data.reviewedAt = this.reviewedAt;
    if (this.actionTaken) data.actionTaken = this.actionTaken;

    return data;
  }

  toJSON() {
    return {
      id: this.id,
      listingId: this.listingId,
      listingTitle: this.listingTitle,
      reportedUserId: this.reportedUserId,
      reportedUserName: this.reportedUserName,
      reporterUserId: this.reporterUserId,
      reporterUserName: this.reporterUserName,
      reason: this.reason,
      description: this.description,
      reportType: this.reportType,
      timestamp: this.timestamp,
      status: this.status,
      adminNotes: this.adminNotes,
      reviewedBy: this.reviewedBy,
      reviewedAt: this.reviewedAt,
      actionTaken: this.actionTaken
    };
  }
}

module.exports = Report;