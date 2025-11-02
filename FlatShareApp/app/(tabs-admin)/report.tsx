// Updated AdminReportsScreen.tsx
{/* This is the admin reports management screen */}
import { reportAPI, Report, ReportStats } from '@/services/ReportAPI';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    total: 0,
    pending: 0,
    resolved: 0,
    rejected: 0,
    byReason: {},
    byActionTaken: {},
    recentReports: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('no_action');
  const [updatingReport, setUpdatingReport] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'resolved' | 'rejected'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        loadReports(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load reports data');
    }
  };

  const loadReports = async () => {
    try {
      console.log('Loading reports from API...');
      const status = filterStatus === 'all' ? undefined : filterStatus;
      const reportsData = await reportAPI.getAllReports(status);
      console.log('Loaded reports:', reportsData.length);
      setReports(reportsData);
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await reportAPI.getReportStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Refresh reports when filter changes
  useEffect(() => {
    if (!loading) {
      loadReports();
    }
  }, [filterStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleReportAction = async (reportId: string, action: 'resolved' | 'rejected') => {
    setUpdatingReport(true);
    try {
      if (action === 'resolved') {
        await reportAPI.resolveReport(reportId, adminNotes, actionTaken);
      } else {
        await reportAPI.rejectReport(reportId, adminNotes);
      }

      setShowDetailsModal(false);
      setAdminNotes('');
      setActionTaken('no_action');
      
      Alert.alert(
        'Success',
        `Report has been ${action === 'resolved' ? 'resolved' : 'rejected'}.`
      );

      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error updating report:', error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message?: string }).message
        : 'Failed to update report';
      Alert.alert('Error', errorMessage || 'Failed to update report');
    } finally {
      setUpdatingReport(false);
    }
  };

  const openReportDetails = (report: Report) => {
    setSelectedReport(report);
    setAdminNotes(report.adminNotes || '');
    setActionTaken(report.actionTaken || 'no_action');
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'resolved': return '#34C759';
      case 'rejected': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'resolved': return 'Resolved';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'listing_removed': return 'Listing Removed';
      case 'user_suspended': return 'User Suspended';
      case 'warning_issued': return 'Warning Issued';
      case 'no_action': return 'No Action Taken';
      default: return action;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderFilterButton = (status: typeof filterStatus, label: string, count: number) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterStatus === status && styles.filterButtonActive
      ]}
      onPress={() => setFilterStatus(status)}
    >
      <Text style={[
        styles.filterButtonText,
        filterStatus === status && styles.filterButtonTextActive
      ]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  const renderReportItem = ({ item }: { item: Report }) => (
    <TouchableOpacity 
      style={styles.reportItem}
      onPress={() => openReportDetails(item)}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>
            {item.listingTitle}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.reportDate}>{formatDate(item.timestamp)}</Text>
      </View>
      
      <Text style={styles.reportReason}>{item.reason}</Text>
      <Text style={styles.reportDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.reportFooter}>
        <Text style={styles.reportedInfo}>
          Reported by: {item.reporterUserName}
        </Text>
        <Text style={styles.reportedUser}>
          User: {item.reportedUserName}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color="#4A3D6A" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A0DAD" />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reported Content</Text>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>Total: {stats.total}</Text>
          <Text style={[styles.statsText, { color: '#FF9500' }]}>Pending: {stats.pending}</Text>
        </View>
      </View>

      {/* Filter Buttons */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {renderFilterButton('all', 'All', stats.total)}
        {renderFilterButton('pending', 'Pending', stats.pending)}
        {renderFilterButton('resolved', 'Resolved', stats.resolved)}
        {renderFilterButton('rejected', 'Rejected', stats.rejected)}
      </ScrollView>

      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="shield-checkmark-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No reports found</Text>
          <Text style={styles.emptySubtext}>
            {filterStatus === 'all' 
              ? 'No reports have been submitted yet.' 
              : `No ${filterStatus} reports found.`
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderReportItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Report Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Reported Listing</Text>
                  <Text style={styles.detailValue}>{selectedReport.listingTitle}</Text>
                  <Text style={styles.detailSubValue}>ID: {selectedReport.listingId}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Reported User</Text>
                  <Text style={styles.detailValue}>{selectedReport.reportedUserName}</Text>
                  <Text style={styles.detailSubValue}>ID: {selectedReport.reportedUserId}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Reported By</Text>
                  <Text style={styles.detailValue}>{selectedReport.reporterUserName}</Text>
                  <Text style={styles.detailSubValue}>ID: {selectedReport.reporterUserId}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Date Reported</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedReport.timestamp)}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedReport.status) }]}>
                    <Text style={styles.statusText}>{getStatusLabel(selectedReport.status)}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Reason</Text>
                  <Text style={styles.detailValue}>{selectedReport.reason}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{selectedReport.description}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Report Type</Text>
                  <Text style={styles.detailValue}>{selectedReport.reportType}</Text>
                </View>

                {selectedReport.status !== 'pending' && (
                  <>
                    {selectedReport.reviewedBy && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Reviewed By</Text>
                        <Text style={styles.detailValue}>{selectedReport.reviewedBy}</Text>
                      </View>
                    )}

                    {selectedReport.reviewedAt && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Review Date</Text>
                        <Text style={styles.detailValue}>{formatDate(selectedReport.reviewedAt)}</Text>
                      </View>
                    )}

                    {selectedReport.actionTaken && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Action Taken</Text>
                        <Text style={styles.detailValue}>{getActionLabel(selectedReport.actionTaken)}</Text>
                      </View>
                    )}

                    {selectedReport.adminNotes && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Admin Notes</Text>
                        <Text style={styles.detailValue}>{selectedReport.adminNotes}</Text>
                      </View>
                    )}
                  </>
                )}

                {selectedReport.status === 'pending' && (
                  <>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Action to Take</Text>
                      <View style={styles.actionPicker}>
                        {['no_action', 'listing_removed', 'user_suspended', 'warning_issued'].map((action) => (
                          <TouchableOpacity
                            key={action}
                            style={[
                              styles.actionOption,
                              actionTaken === action && styles.actionOptionSelected
                            ]}
                            onPress={() => setActionTaken(action)}
                          >
                            <Text style={[
                              styles.actionOptionText,
                              actionTaken === action && styles.actionOptionTextSelected
                            ]}>
                              {getActionLabel(action)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Admin Notes (Optional)</Text>
                      <TextInput
                        style={styles.adminNotesInput}
                        placeholder="Add notes about your decision..."
                        placeholderTextColor="#999"
                        multiline={true}
                        numberOfLines={3}
                        value={adminNotes}
                        onChangeText={setAdminNotes}
                        maxLength={500}
                      />
                    </View>
                  </>
                )}
              </ScrollView>
            )}

            {selectedReport?.status === 'pending' && (
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.rejectButton}
                  onPress={() => handleReportAction(selectedReport.id, 'rejected')}
                  disabled={updatingReport}
                >
                  <Text style={styles.rejectButtonText}>
                    {updatingReport ? 'Processing...' : 'Reject Report'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.resolveButton}
                  onPress={() => handleReportAction(selectedReport.id, 'resolved')}
                  disabled={updatingReport}
                >
                  <Text style={styles.resolveButtonText}>
                    {updatingReport ? 'Processing...' : 'Resolve Report'}
                  </Text>
                </TouchableOpacity>
              </View>
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
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  headerStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statsText: { fontSize: 14, color: '#666' },
  
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
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 4, textAlign: 'center' },
  
  listContent: { paddingBottom: 20 },
  
  reportItem: { 
    backgroundColor: '#fff', 
    marginHorizontal: 16, 
    marginVertical: 6, 
    borderRadius: 12, 
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reportInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  reportTitle: { fontSize: 16, fontWeight: '600', color: '#333', flex: 1, marginRight: 8 },
  reportDate: { fontSize: 12, color: '#666' },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  
  reportReason: { fontSize: 14, fontWeight: '500', color: '#f39c12', marginBottom: 4 },
  reportDescription: { fontSize: 14, color: '#666', marginBottom: 8 },
  
  reportFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reportedInfo: { fontSize: 12, color: '#999' },
  reportedUser: { fontSize: 12, color: '#999' },
  
  actionButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  viewDetailsText: { fontSize: 14, color: '#4A3D6A', fontWeight: '500', marginRight: 4 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalScrollView: { padding: 20, maxHeight: 500 },
  
  detailSection: { marginBottom: 16 },
  detailLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 4 },
  detailValue: { fontSize: 16, color: '#333' },
  detailSubValue: { fontSize: 12, color: '#999', marginTop: 2 },
  
  actionPicker: { marginTop: 8 },
  actionOption: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e9ecef', borderRadius: 6, marginBottom: 4 },
  actionOptionSelected: { backgroundColor: '#6A0DAD', borderColor: '#6A0DAD' },
  actionOptionText: { fontSize: 14, color: '#333' },
  actionOptionTextSelected: { color: '#fff', fontWeight: '500' },
  
  adminNotesInput: { borderWidth: 1, borderColor: '#e9ecef', borderRadius: 6, padding: 12, fontSize: 14, textAlignVertical: 'top', minHeight: 80 },
  
  modalActions: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#e9ecef' },
  rejectButton: { flex: 1, backgroundColor: '#dc3545', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginRight: 8 },
  rejectButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resolveButton: { flex: 1, backgroundColor: '#28a745', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginLeft: 8 },
  resolveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});