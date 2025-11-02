// services/ReportAPI.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://flatshare-final.onrender.com';

export interface Report {
  id: string;
  listingId: string;
  listingTitle: string;
  reportedUserId: string;
  reportedUserName: string;
  reporterUserId: string;
  reporterUserName: string;
  reason: string;
  description: string;
  reportType: string;
  timestamp: string;
  status: 'pending' | 'resolved' | 'rejected';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  actionTaken?: string;
}

export interface ReportStats {
  total: number;
  pending: number;
  resolved: number;
  rejected: number;
  byReason: { [key: string]: number };
  byActionTaken: { [key: string]: number };
  recentReports: number;
}

class ReportAPI {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async createReport(reportData: {
    listingId: string;
    listingTitle: string;
    reportedUserId: string;
    reportedUserName: string;
    reporterUserName: string;
    reason: string;
    description: string;
    reportType?: string;
  }): Promise<Report> {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(reportData),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create report');
    }

    return result.data;
  }

  async getAllReports(status?: string): Promise<Report[]> {
    const queryParams = status ? `?status=${status}` : '';
    
    const response = await fetch(`${API_BASE_URL}/reports${queryParams}`, {
      headers: await this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch reports');
    }

    return result.data;
  }

  async getReportById(reportId: string): Promise<Report> {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
      headers: await this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch report');
    }

    return result.data;
  }

  async resolveReport(reportId: string, notes?: string, actionTaken?: string): Promise<Report> {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}/resolve`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        notes: notes || '',
        actionTaken: actionTaken || 'no_action'
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to resolve report');
    }

    return result.data;
  }

  async rejectReport(reportId: string, notes?: string): Promise<Report> {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}/reject`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        notes: notes || ''
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to reject report');
    }

    return result.data;
  }

  async getReportStats(): Promise<ReportStats> {
    const response = await fetch(`${API_BASE_URL}/reports/stats`, {
      headers: await this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch report stats');
    }

    return result.data;
  }

  async getReportsByListing(listingId: string): Promise<Report[]> {
    const response = await fetch(`${API_BASE_URL}/reports/listing/${listingId}`, {
      headers: await this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch reports for listing');
    }

    return result.data;
  }
}

export const reportAPI = new ReportAPI();