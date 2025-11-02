{/* This is the admin home screen showing dashboard stats and navigation options 
  It fetches data from Firestore and listens for real-time updates
  */}

import { auth, firestore } from '@/lib/firebaseConfig';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AnnouncementDisplay from '../(tabs)/announcement';
import { userManagementAPI } from '@/services/UserManagementAPI';

type CommunityStats = {
  totalUnits: number;
  totalResidents: number;
  pendingApprovals: number;
  communityName: string;
};

export default function Home() {
  const router = useRouter();
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [stats, setStats] = useState<CommunityStats>({
    totalUnits: 0,
    totalResidents: 0,
    pendingApprovals: 0,
    communityName: '',
  });

  const currentAdmin = auth.currentUser;

  useEffect(() => {
    const loadDashboardStats = async () => {
      if (!currentAdmin) {
        setStats(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        // First, get the admin's community information
        const adminDocRef = doc(firestore, 'users', 'admins', 'details', currentAdmin.uid);
        const adminSnap = await getDoc(adminDocRef);
        
        if (!adminSnap.exists()) {
          console.error('Admin document not found');
          setStats(prev => ({ ...prev, loading: false }));
          return;
        }

        const adminData = adminSnap.data();
        const communityName = adminData.communityName;

        if (!communityName) {
          console.error('Community name not found in admin document');
          setStats(prev => ({ ...prev, loading: false }));
          return;
        }

        setStats(prev => ({ ...prev, communityName }));

        // Get total units from community document
        const communityDocRef = doc(firestore, 'communities', communityName);
        const communitySnap = await getDoc(communityDocRef);
        
        let totalUnits = 0;
        if (communitySnap.exists()) {
          const communityData = communitySnap.data();
          totalUnits = parseInt(communityData.units, 10) || 0;
        }

        // Get total residents and pending approvals
        const residentsRef = collection(firestore, 'users', 'residents', 'communities', communityName, 'details');
        
        // Listen to real-time updates for residents
        const unsubscribe = onSnapshot(residentsRef, (snapshot) => {
          const residents = snapshot.docs.map(doc => doc.data());
          
          const totalResidents = residents.length;
          const pendingApprovals = residents.filter(resident => 
            resident.status === 'pending' || !resident.status
          ).length;

          setStats({
            totalUnits,
            totalResidents,
            pendingApprovals,
            communityName,
          });
        }, (error) => {
          console.error('Error listening to residents:', error);
          // Set stats without real-time data
          setStats({
            totalUnits,
            totalResidents: 0,
            pendingApprovals: 0,
            communityName,
          });
        });

        // Return cleanup function
        return () => unsubscribe();

      } catch (error) {
        console.error('Error loading dashboard stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    loadDashboardStats();
  }, [currentAdmin]);
  

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Admin Panel</Text>
            {stats.communityName && (
              <Text style={styles.headerSubtitle}>{stats.communityName}</Text>
            )}
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.notificationContainer}>
              <Ionicons name="notifications-outline" size={24} color="#888" />
              {stats.pendingApprovals > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>
                    {stats.pendingApprovals > 99 ? '99+' : stats.pendingApprovals}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.profileImageContainer}>
              <Ionicons name="person-circle-outline" size={32} color="#888" /> 
            </View>
          </View>
        </View>

        {/* Overview Card */}
        <View style={styles.buttonGrid}>
          <TouchableOpacity 
            style={styles.gridButton}
            onPress={() => {
              router.push("/community-registration");
              console.log("Navigate to Register Complex");
            }}
          >
            <Ionicons name="business-outline" size={40} color="#6A0DAD" />
            <Text style={styles.gridButtonText}>Register Complex</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.gridButton,
              stats.pendingApprovals > 0 && styles.gridButtonAlert
            ]}
            onPress={() => {
              router.push("/users");
              console.log("Navigate to Manage Users");
            }}
          >
            <View style={styles.gridButtonIconContainer}>
              <Ionicons name="people-outline" size={40} color="#6A0DAD" />
              {stats.pendingApprovals > 0 && (
                <View style={styles.gridButtonBadge}>
                  <Text style={styles.gridButtonBadgeText}>
                    {stats.pendingApprovals > 99 ? '99+' : stats.pendingApprovals}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.gridButtonText}>Manage Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.gridButton}
            onPress={() => {
              router.push("/report");
              console.log("Navigate to Reports Screen");
            }}
          >
            <Ionicons name="document-text-outline" size={40} color="#6A0DAD" />
            <Text style={styles.gridButtonText}>View Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridButton}
            onPress={() => {
              setShowAnnouncement(true);
              console.log("Open Announcement Modal");
            }}
          >
            <Ionicons name="mail-outline" size={40} color="#6A0DAD" />
            <Text style={styles.gridButtonText}>Announcements</Text>
          </TouchableOpacity>
        </View>

        <View>
          <TouchableOpacity style={styles.button}
            onPress={() => {
              router.push("/create-announcement");
              console.log("Navigate to Create Announcement Screen");
            }}>
            <Entypo name="megaphone" size={20} color="#fff" />
            <Text style={styles.text}>Broadcast Announcement</Text>
          </TouchableOpacity>
        </View>

        {/* Modal */}
        <Modal
          visible={showAnnouncement}
          animationType="slide"
          onRequestClose={() => setShowAnnouncement(false)}
        >
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={{ padding: 12, backgroundColor: '#f80000ff', alignSelf: 'flex-end' }}
              onPress={() => setShowAnnouncement(false)}
            >
              <Text style={{ color: '#fff' }}>Close</Text>
            </TouchableOpacity>
            <AnnouncementDisplay />
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationContainer: {
    position: 'relative',
    marginRight: 15,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileImageContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    marginTop: 10,
  },
  overviewMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  metricItem: {
    alignItems: 'center',
    width: '30%',
  },
  metricIconContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  metricBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#333',
  },
  metricNumberAlert: {
    color: '#FF6B6B',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  gridButton: {
    width: '48%',
    backgroundColor: '#f8f8f8ff',
    borderRadius: 15,
    paddingVertical: 30,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  gridButtonAlert: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
    backgroundColor: '#FFF5F5',
  },
  gridButtonIconContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  gridButtonBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridButtonBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gridButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
    color: '#333',
  },
  communityInfoCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
  },
  communityInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  communityInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  communityInfoLabel: {
    fontSize: 14,
    color: '#666',
  },
  communityInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6A0DAD',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});