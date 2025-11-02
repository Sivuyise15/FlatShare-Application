{/*
  This service handles reporting functionality, including creating and managing reports.
  It serves as an intermediary between controllers and the data layer.
*/}

const ReportRepository = require('../repositories/ReportRepository');
const Report = require('../entities/Report');

class ReportService {
  constructor(db) {
    this.reportRepository = new ReportRepository(db);
  }
  // Create a new report
  async createReport(reportData) {
    const {
      listingId,
      listingTitle,
      reportedUserId,
      reportedUserName,
      reporterUserId,
      reporterUserName,
      reason,
      description,
      reportType = 'listing'
    } = reportData;

    // Check for duplicate report
    const isDuplicate = await this.reportRepository.checkDuplicateReport(listingId, reporterUserId);
    if (isDuplicate) {
      throw new Error('You have already reported this listing');
    }

    // Create report entity
    const report = new Report(
      listingId,
      listingTitle,
      reportedUserId,
      reportedUserName,
      reporterUserId,
      reporterUserName,
      reason,
      description,
      reportType
    );

    return await this.reportRepository.create(report);
  }
  // Fetch reports with various filters
  async getAllReports() {
    return await this.reportRepository.findAll();
  }
  // Fetch a single report by ID
  async getReportById(reportId) {
    const report = await this.reportRepository.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }
    return report;
  }
  // Fetch reports by status
  async getReportsByStatus(status) {
    const validStatuses = ['pending', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status. Must be: pending, resolved, or rejected');
    }
    return await this.reportRepository.findByStatus(status);
  }
  // Fetch reports by listing ID
  async getReportsByListingId(listingId) {
    return await this.reportRepository.findByListingId(listingId);
  }
  // Fetch reports by reported user ID
  async getReportsByUser(userId) {
    return await this.reportRepository.findByReportedUser(userId);
  }
  // Report management: resolve or reject
  async resolveReport(reportId, adminId, notes = '', actionTaken = 'no_action') {
    const report = await this.reportRepository.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    if (report.status !== 'pending') {
      throw new Error('Only pending reports can be resolved');
    }

    report.resolve(adminId, notes, actionTaken);
    return await this.reportRepository.update(reportId, report);
  }

  async rejectReport(reportId, adminId, notes = '') {
    const report = await this.reportRepository.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    if (report.status !== 'pending') {
      throw new Error('Only pending reports can be rejected');
    }

    report.reject(adminId, notes);
    return await this.reportRepository.update(reportId, report);
  }
  // Generate report statistics
  async getReportStats() {
    const reports = await this.reportRepository.findAll();

    const stats = {
      total: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      resolved: reports.filter(r => r.status === 'resolved').length,
      rejected: reports.filter(r => r.status === 'rejected').length,
      byReason: {},
      byActionTaken: {},
      recentReports: reports.filter(r => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(r.timestamp) > weekAgo;
      }).length
    };

    // Count by reason
    reports.forEach(report => {
      stats.byReason[report.reason] = (stats.byReason[report.reason] || 0) + 1;
    });

    // Count by action taken (for resolved reports)
    reports.filter(r => r.status === 'resolved').forEach(report => {
      if (report.actionTaken) {
        stats.byActionTaken[report.actionTaken] = (stats.byActionTaken[report.actionTaken] || 0) + 1;
      }
    });

    return stats;
  }
}

module.exports = ReportService;