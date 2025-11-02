// backend/controllers/ReportController.js
{/*
  Controller for handling report-related operations.
  This includes creating reports, fetching reports, resolving/rejecting reports,
  and getting report statistics.
  It interacts with the ReportService for business logic.
*/}
const ReportService = require('../services/report.service');

class ReportController {
  constructor(db) {
    this.reportService = new ReportService(db);
  }
  // Create a new report
  async createReport(req, res) {
    try {
      const reportData = req.body;
      const reporterUserId = req.user?.uid;

      if (!reporterUserId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // Add reporter ID to the data
      reportData.reporterUserId = reporterUserId;

      const report = await this.reportService.createReport(reportData);
      
      res.status(201).json({
        success: true,
        message: 'Report submitted successfully',
        data: report.toJSON()
      });
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  // Get all reports, with optional status filter
  async getAllReports(req, res) {
    try {
      const { status } = req.query;
      let reports;

      if (status) {
        reports = await this.reportService.getReportsByStatus(status);
      } else {
        reports = await this.reportService.getAllReports();
      }

      res.json({
        success: true,
        data: reports.map(report => report.toJSON())
      });
    } catch (error) {
      console.error('Error getting reports:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  // Get a specific report by ID
  async getReportById(req, res) {
    try {
      const { id } = req.params;
      const report = await this.reportService.getReportById(id);
      
      res.json({
        success: true,
        data: report.toJSON()
      });
    } catch (error) {
      console.error('Error getting report:', error);
      
      if (error.message === 'Report not found') {
        return res.status(404).json({ success: false, error: error.message });
      }
      
      res.status(500).json({ success: false, error: error.message });
    }
  }
  // Resolve a report
  async resolveReport(req, res) {
    try {
      const { id } = req.params;
      const { notes, actionTaken } = req.body;
      const adminId = req.user?.uid;

      if (!adminId) {
        return res.status(401).json({ success: false, error: 'Admin authentication required' });
      }

      const report = await this.reportService.resolveReport(id, adminId, notes, actionTaken);
      
      res.json({
        success: true,
        message: 'Report resolved successfully',
        data: report.toJSON()
      });
    } catch (error) {
      console.error('Error resolving report:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  // Reject a report
  async rejectReport(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminId = req.user?.uid;

      if (!adminId) {
        return res.status(401).json({ success: false, error: 'Admin authentication required' });
      }

      const report = await this.reportService.rejectReport(id, adminId, notes);
      
      res.json({
        success: true,
        message: 'Report rejected successfully',
        data: report.toJSON()
      });
    } catch (error) {
      console.error('Error rejecting report:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  // Get report statistics
  async getReportStats(req, res) {
    try {
      const stats = await this.reportService.getReportStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting report stats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  // Get reports for a specific listing
  async getReportsByListing(req, res) {
    try {
      const { listingId } = req.params;
      const reports = await this.reportService.getReportsByListingId(listingId);
      
      res.json({
        success: true,
        data: reports.map(report => report.toJSON())
      });
    } catch (error) {
      console.error('Error getting reports by listing:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = ReportController;