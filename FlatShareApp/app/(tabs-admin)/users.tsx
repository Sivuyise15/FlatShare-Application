{/* This is the user management screen for admins
  It allows searching, filtering, approving, rejecting, suspending, and unsuspending users
  It fetches data from a backend API and uses AsyncStorage for local data
  */}

import { userManagementAPI, User, UserStats } from '@/services/UserManagementAPI';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UsersManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    pending: 0,
    active: 0,
    suspended: 0,
    recentJoins: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
  const [userCommunity, setUserCommunity] = useState<string | null>(null);

  useEffect(() => {
    initializeAndLoadData();
  }, []);

  const initializeAndLoadData = async () => {
    try {
      // Get user community from AsyncStorage
      const community = await AsyncStorage.getItem('userCommunity');
      console.log('User community from storage:', community);
      setUserCommunity(community);
      
      if (community) {
        await loadData(community);
      } else {
        console.warn('No user community found in storage');
        Alert.alert('Error', 'User community not found. Please log in again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error initializing:', error);
      Alert.alert('Error', 'Failed to initialize user management');
      setLoading(false);
    }
  };
  // Load users and stats
  const loadData = async (community: string) => {
    try {
      await Promise.all([
        loadUsers(community),
        loadStats(community)
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load user data');
    }
  };
  // Load users with current filters
  const loadUsers = async (community: string) => {
    try {
      console.log('Loading users from API for community:', community);
      const filters: any = { community }; // Always include community
      
      if (activeFilter !== 'all') {
        filters.status = activeFilter;
      }
      
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      console.log('API call filters:', filters);
      const usersData = await userManagementAPI.getAllUsers(filters);
      console.log('Loaded users:', usersData.length);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStats = async (community: string) => {
    try {
      console.log('Loading stats for community:', community);
      const statsData = await userManagementAPI.getUserStats(community);
      console.log('Loaded stats:', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Don't show alert for stats error, it's not critical
    }
  };

  // Refresh users when search or filter changes
  useEffect(() => {
    if (!userCommunity) return;
    
    const delayedSearch = setTimeout(() => {
      if (!loading) {
        loadUsers(userCommunity);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, activeFilter, userCommunity]);

  const onRefresh = async () => {
    if (!userCommunity) return;
    
    setRefreshing(true);
    await loadData(userCommunity);
  };

  const handleApproveUser = async (userId: string) => {
    if (!userCommunity) {
      Alert.alert('Error', 'Community information not available');
      return;
    }

    setUpdatingUser(true);
    try {
      console.log('Approving user:', userId, 'in community:', userCommunity);
      await userManagementAPI.approveUser(userId, userCommunity);
      Alert.alert('Success', 'User has been approved successfully.');
      setShowUserModal(false);
      await loadData(userCommunity); // Refresh data
    } catch (error) {
      console.error('Error approving user:', error);
      Alert.alert('Error', 
        error instanceof Error ? error.message : 'Failed to approve user'
      );
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!userCommunity) {
      Alert.alert('Error', 'Community information not available');
      return;
    }

    Alert.alert(
      'Confirm Rejection',
      'Are you sure you want to reject this user? This will permanently delete their account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setUpdatingUser(true);
            try {
              console.log('Rejecting user:', userId, 'in community:', userCommunity);
              await userManagementAPI.rejectUser(userId, userCommunity);
              Alert.alert('Success', 'User has been rejected and removed.');
              setShowUserModal(false);
              await loadData(userCommunity);
            } catch (error) {
              console.error('Error rejecting user:', error);
              Alert.alert('Error', 
                error instanceof Error ? error.message : 'Failed to reject user'
              );
            } finally {
              setUpdatingUser(false);
            }
          }
        }
      ]
    );
  };

  const handleSuspendUser = async (userId: string) => {
    if (!userCommunity) {
      Alert.alert('Error', 'Community information not available');
      return;
    }

    Alert.alert(
      'Suspend User',
      'Are you sure you want to suspend this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            setUpdatingUser(true);
            try {
              console.log('Suspending user:', userId, 'in community:', userCommunity);
              await userManagementAPI.suspendUser(
                userId, 
                userCommunity, 
                'Administrative decision', 
                30
              );
              Alert.alert('Success', 'User has been suspended.');
              setShowUserModal(false);
              await loadData(userCommunity);
            } catch (error) {
              console.error('Error suspending user:', error);
              Alert.alert('Error', 
                error instanceof Error ? error.message : 'Failed to suspend user'
              );
            } finally {
              setUpdatingUser(false);
            }
          }
        }
      ]
    );
  };

  const handleUnsuspendUser = async (userId: string) => {
    if (!userCommunity) {
      Alert.alert('Error', 'Community information not available');
      return;
    }

    setUpdatingUser(true);
    try {
      console.log('Unsuspending user:', userId, 'in community:', userCommunity);
      await userManagementAPI.unsuspendUser(userId, userCommunity);
      Alert.alert('Success', 'User has been unsuspended.');
      setShowUserModal(false);
      await loadData(userCommunity);
    } catch (error) {
      console.error('Error unsuspending user:', error);
      Alert.alert('Error', 
        error instanceof Error ? error.message : 'Failed to unsuspend user'
      );
    } finally {
      setUpdatingUser(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const getFilteredUsers = () => {
    return users; // Filtering is now done on the backend
  };

  const FilterButton = ({ 
    title, 
    value, 
    count 
  }: { 
    title: string; 
    value: 'all' | 'pending' | 'active' | 'suspended';
    count: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === value && styles.filterButtonActive
      ]}
      onPress={() => setActiveFilter(value)}
    >
      <Text style={[
        styles.filterButtonText,
        activeFilter === value && styles.filterButtonTextActive
      ]}>
        {title} ({count})
      </Text>
    </TouchableOpacity>
  );

  const UserCard = ({ user }: { user: User }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => {
        setSelectedUser(user);
        setShowUserModal(true);
      }}
    >
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#666" />
              </View>
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {user.name} {user.surname} - Flat {user.flatNumber}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userCommunity}>{user.community}</Text>
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: user.status === 'pending' ? '#FFF3CD' : 
                             user.status === 'active' ? '#D4EDDA' : '#F8D7DA'
            }
          ]}>
            <Text style={[
              styles.statusText,
              {
                color: user.status === 'pending' ? '#856404' :
                       user.status === 'active' ? '#155724' : '#721C24'
              }
            ]}>
              {user.status === 'pending' ? 'Pending' :
               user.status === 'active' ? 'Active' : 'Suspended'}
            </Text>
          </View>
        </View>
      </View>

      {user.status === 'pending' && (
        <View style={styles.pendingActions}>
          <TouchableOpacity 
            style={styles.quickRejectButton}
            onPress={() => handleRejectUser(user.id)}
            disabled={updatingUser}
          >
            <Ionicons name="close-circle" size={16} color="#dc3545" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickApproveButton}
            onPress={() => handleApproveUser(user.id)}
            disabled={updatingUser}
          >
            <Ionicons name="checkmark-circle" size={16} color="#28a745" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A0DAD" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userCommunity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="warning-outline" size={64} color="#f39c12" />
          <Text style={styles.loadingText}>Community information not available</Text>
          <Text style={styles.loadingSubtext}>Please log in again</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Stats */}
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.communityLabel}>Community: {userCommunity}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#f39c12' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#27ae60' }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#e74c3c' }]}>{stats.suspended}</Text>
            <Text style={styles.statLabel}>Suspended</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Buttons */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <FilterButton title="All" value="all" count={stats.total} />
        <FilterButton title="Pending" value="pending" count={stats.pending} />
        <FilterButton title="Active" value="active" count={stats.active} />
        <FilterButton title="Suspended" value="suspended" count={stats.suspended} />
      </ScrollView>

      {/* Users List */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {getFilteredUsers().length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No users match your search' : 'No users found'}
            </Text>
          </View>
        ) : (
          getFilteredUsers().map((user) => (
            <UserCard key={user.id} user={user} />
          ))
        )}
      </ScrollView>

      {/* User Details Modal - keeping your existing modal code */}
      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.userProfile}>
                  {selectedUser.profileImage ? (
                    <Image source={{ uri: selectedUser.profileImage }} style={styles.profileAvatar} />
                  ) : (
                    <View style={styles.profileAvatarPlaceholder}>
                      <Ionicons name="person" size={32} color="#666" />
                    </View>
                  )}
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>
                      {selectedUser.name} {selectedUser.surname}
                    </Text>
                    <Text style={styles.profileEmail}>{selectedUser.email}</Text>
                    <Text style={styles.profileMeta}>
                      Flat {selectedUser.flatNumber} • {selectedUser.community}
                    </Text>
                    <Text style={styles.profileMeta}>
                      Member since {formatDate(selectedUser.createdAt)}
                    </Text>
                  </View>
                </View>

                <View style={styles.userInfoSection}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={[
                    styles.infoValue,
                    {
                      color: selectedUser.status === 'pending' ? '#f39c12' :
                             selectedUser.status === 'active' ? '#27ae60' : '#e74c3c'
                    }
                  ]}>
                    {selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)}
                  </Text>
                </View>

                {selectedUser.bio && (
                  <View style={styles.userInfoSection}>
                    <Text style={styles.infoLabel}>Bio</Text>
                    <Text style={styles.infoValue}>{selectedUser.bio}</Text>
                  </View>
                )}

                {selectedUser.suspensionReason && (
                  <View style={styles.userInfoSection}>
                    <Text style={styles.infoLabel}>Suspension Reason</Text>
                    <Text style={styles.infoValue}>{selectedUser.suspensionReason}</Text>
                  </View>
                )}

                {selectedUser.suspensionEnd && (
                  <View style={styles.userInfoSection}>
                    <Text style={styles.infoLabel}>Suspension Until</Text>
                    <Text style={styles.infoValue}>{formatDate(selectedUser.suspensionEnd)}</Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  {selectedUser.status === 'pending' && (
                    <>
                      <TouchableOpacity 
                        style={styles.modalRejectButton}
                        onPress={() => handleRejectUser(selectedUser.id)}
                        disabled={updatingUser}
                      >
                        <Text style={styles.modalRejectButtonText}>
                          {updatingUser ? 'Processing...' : 'Reject User'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.modalApproveButton}
                        onPress={() => handleApproveUser(selectedUser.id)}
                        disabled={updatingUser}
                      >
                        <Text style={styles.modalApproveButtonText}>
                          {updatingUser ? 'Processing...' : 'Approve User'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {selectedUser.status === 'active' && (
                    <TouchableOpacity 
                      style={styles.modalSuspendButton}
                      onPress={() => handleSuspendUser(selectedUser.id)}
                      disabled={updatingUser}
                    >
                      <Text style={styles.modalSuspendButtonText}>
                        {updatingUser ? 'Processing...' : 'Suspend User'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {selectedUser.status === 'suspended' && (
                    <TouchableOpacity 
                      style={styles.modalUnsuspendButton}
                      onPress={() => handleUnsuspendUser(selectedUser.id)}
                      disabled={updatingUser}
                    >
                      <Text style={styles.modalUnsuspendButtonText}>
                        {updatingUser ? 'Processing...' : 'Unsuspend User'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  
  header: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 16, 
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  
  searchContainer: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12 },
  searchInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#faf8f8ff', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 8,
    height: 48
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 10, color: '#333' },
  
  filterContainer: { 
  backgroundColor: '#ffffffff',
  paddingVertical: 6,
  maxHeight: 48,        
  },
  filterContent: {
    alignItems: 'center', 
    paddingHorizontal: 8,
  },
  filterButton: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    marginRight: 8, 
    backgroundColor: '#f8f9fa', 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  filterButtonActive: { backgroundColor: '#6A0DAD', borderColor: '#6A0DAD' },
  filterButtonText: { fontSize: 14, color: '#666' },
  filterButtonTextActive: { color: '#fff', fontWeight: '600' },
  
  content: { flex: 1, paddingHorizontal: 16 },
  
  userCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { flexDirection: 'row', flex: 1 },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#f8f9fa', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  userDetails: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: '#333' },
  userEmail: { fontSize: 14, color: '#666', marginTop: 2 },
  userCommunity: { fontSize: 12, color: '#999', marginTop: 2 },
  
  statusContainer: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  
  pendingActions: { flexDirection: 'row', marginTop: 8 },
  quickRejectButton: { marginRight: 12, padding: 8 },
  quickApproveButton: { padding: 8 },
  
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 60 
  },
  emptyText: { fontSize: 16, color: '#666', marginTop: 12 },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  
  // Modal styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    maxHeight: '80%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e9ecef' 
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalScrollView: { padding: 20 },
  
  userProfile: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
  profileAvatarPlaceholder: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#f8f9fa', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  profileEmail: { fontSize: 14, color: '#666', marginTop: 2 },
  profileMeta: { fontSize: 12, color: '#999', marginTop: 2 },
  
  userInfoSection: { marginBottom: 16 },
  infoLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 4 },
  infoValue: { fontSize: 16, color: '#333' },
  
  modalActions: { marginTop: 20 },
  modalApproveButton: { 
    backgroundColor: '#28a745', 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 8 
  },
  modalApproveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalRejectButton: { 
    backgroundColor: '#dc3545', 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 8 
  },
  modalRejectButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalSuspendButton: { 
    backgroundColor: '#ffc107', 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 8 
  },
  modalSuspendButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalUnsuspendButton: { 
    backgroundColor: '#17a2b8', 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 8 
  },
  modalUnsuspendButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  communityLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
  loadingSubtext: { fontSize: 14, color: '#999', marginTop: 4 },
});