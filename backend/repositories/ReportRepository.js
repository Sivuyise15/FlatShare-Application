// backend/repositories/ReportRepository.js
{/**
 * ReportRepository.js
 * 
 * This repository handles CRUD operations for Report entities in Firestore.
 * It includes methods to create, read, update, and query reports based on various criteria.
 */}
const BaseRepository = require('./BaseRepository');
const Report = require('../entities/Report');

class ReportRepository extends BaseRepository {
  constructor(db) {
    super(db);
    this.reportsRef = this.db.collection('reports');
  }
  // Create a new report
  async create(reportEntity) {
    if (!(reportEntity instanceof Report)) {
      throw new Error('Invalid report entity provided');
    }

    try {
      const docRef = await this.reportsRef.add(reportEntity.toFirestore());
      reportEntity.id = docRef.id;
      return reportEntity;
    } catch (error) {
      this.handleError('create report', error);
    }
  }
  // Find a report by its ID
  async findById(reportId) {
    if (!reportId || typeof reportId !== 'string') {
      throw new Error('Report ID is required');
    }

    try {
      const doc = await this.reportsRef.doc(reportId).get();
      if (!doc.exists) {
        return null;
      }
      
      return Report.fromFirestore(doc);
    } catch (error) {
      this.handleError('find report by ID', error);
    }
  }
  // Retrieve all reports, ordered by timestamp descending
  async findAll() {
    try {
      const snapshot = await this.reportsRef.orderBy('timestamp', 'desc').get();
      return snapshot.docs.map(doc => Report.fromFirestore(doc));
    } catch (error) {
      this.handleError('find all reports', error);
    }
  }
  // Find reports by their status
  async findByStatus(status) {
    if (!status || typeof status !== 'string') {
      throw new Error('Status is required');
    }

    try {
      const snapshot = await this.reportsRef
        .where('status', '==', status)
        .orderBy('timestamp', 'desc')
        .get();
      
      return snapshot.docs.map(doc => Report.fromFirestore(doc));
    } catch (error) {
      this.handleError('find reports by status', error);
    }
  }
  // Find reports by the associated listing ID
  async findByListingId(listingId) {
    if (!listingId || typeof listingId !== 'string') {
      throw new Error('Listing ID is required');
    }

    try {
      const snapshot = await this.reportsRef
        .where('listingId', '==', listingId)
        .orderBy('timestamp', 'desc')
        .get();
      
      return snapshot.docs.map(doc => Report.fromFirestore(doc));
    } catch (error) {
      this.handleError('find reports by listing', error);
    }
  }
  // Find reports by the reported user's ID
  async findByReportedUser(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required');
    }

    try {
      const snapshot = await this.reportsRef
        .where('reportedUserId', '==', userId)
        .orderBy('timestamp', 'desc')
        .get();
      
      return snapshot.docs.map(doc => Report.fromFirestore(doc));
    } catch (error) {
      this.handleError('find reports by reported user', error);
    }
  }
  // Update an existing report
  async update(reportId, reportEntity) {
    if (!(reportEntity instanceof Report)) {
      throw new Error('Invalid report entity provided');
    }

    try {
      await this.reportsRef.doc(reportId).update(reportEntity.toFirestore());
      reportEntity.id = reportId;
      return reportEntity;
    } catch (error) {
      this.handleError('update report', error);
    }
  }
  // Check for duplicate reports by the same user on the same listing
  async checkDuplicateReport(listingId, reporterUserId) {
    try {
      const snapshot = await this.reportsRef
        .where('listingId', '==', listingId)
        .where('reporterUserId', '==', reporterUserId)
        .limit(1)
        .get();
      
      return !snapshot.empty;
    } catch (error) {
      this.handleError('check duplicate report', error);
    }
  }
}

module.exports = ReportRepository;