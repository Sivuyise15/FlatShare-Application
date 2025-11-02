{/* UserManagementAPI.ts
 *
 * This module provides functions to interact with the User Management API
 * for the FlatShare App. It includes functionalities to fetch users,
 * approve/reject user registrations, suspend/unsuspend users, and get user statistics.
 */}

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://flatshare-final.onrender.com';

export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  community: string;
  flatNumber: string;
  role: 'resident' | 'admin';
  status: 'pending' | 'active' | 'suspended';
  createdAt: string;
  profileImage?: string;
  bio?: string;
  lastActivity?: string;
  approvedBy?: string;
  approvedAt?: string;
  suspendedBy?: string;
  suspendedAt?: string;
  suspensionReason?: string;
  suspensionEnd?: string;
  unsuspendedBy?: string;
  unsuspendedAt?: string;
}

export interface UserStats {
  total: number;
  pending: number;
  active: number;
  suspended: number;
  recentJoins: number;
}

class UserManagementAPI {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // Fetch all users with optional filters
  async getAllUsers(filters?: { 
    community?: string; 
    status?: string; 
    search?: string 
  }): Promise<User[]> {
    const queryParams = new URLSearchParams();
    
    if (filters?.community) queryParams.append('community', filters.community);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.search) queryParams.append('search', filters.search);

    const response = await fetch(`${API_BASE_URL}/user-management?${queryParams}`, {
      headers: await this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch users');
    }

    return result.data;
  }

  // Get user by ID - REQUIRES community parameter
  async getUserById(userId: string, community: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/user-management/${userId}?community=${community}`, {
      headers: await this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch user');
    }

    return result.data;
  }

  // Approve user - community in request body
  async approveUser(userId: string, community: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/user-management/${userId}/approve`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        community: community
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to approve user');
    }

    return result.data;
  }

  // Reject user - community in request body
  async rejectUser(userId: string, community: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/user-management/${userId}/reject`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        community: community
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to reject user');
    }
  }

  // Suspend user - community, reason, and durationDays in request body
  async suspendUser(
    userId: string, 
    community: string, 
    reason?: string, 
    durationDays?: number
  ): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/user-management/${userId}/suspend`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        community: community,
        reason: reason || 'Administrative decision',
        durationDays: durationDays || 30
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to suspend user');
    }

    return result.data;
  }

  // Unsuspend user - community in request body
  async unsuspendUser(userId: string, community: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/user-management/${userId}/unsuspend`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        community: community
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to unsuspend user');
    }

    return result.data;
  }

  // Get user statistics - community as query parameter
  async getUserStats(community?: string): Promise<UserStats> {
    const queryParams = community ? `?community=${community}` : '';
    
    const response = await fetch(`${API_BASE_URL}/user-management/stats${queryParams}`, {
      headers: await this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch user stats');
    }

    return result.data;
  }
}

export const userManagementAPI = new UserManagementAPI();