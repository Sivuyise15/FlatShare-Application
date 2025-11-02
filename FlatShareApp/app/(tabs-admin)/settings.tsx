import { auth } from '@/lib/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function AdminSettingsScreen() {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailReports: true,
    autoApproval: false,
    maintenanceMode: false,
    darkMode: false,
  });
  
  const router = useRouter();
  const currentUser = auth.currentUser;

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/auth');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All complex data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Feature Not Available', 'Account deletion requires additional security verification. Please contact support.');
          },
        },
      ],
    );
  };

  const SettingsItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true, 
    rightComponent = null,
    variant = 'default'
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
    variant?: 'default' | 'destructive';
  }) => (
    <TouchableOpacity 
      style={[
        styles.settingsItem,
        variant === 'destructive' && styles.destructiveItem
      ]}
      onPress={onPress}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[
          styles.iconContainer,
          variant === 'destructive' && styles.destructiveIconContainer
        ]}>
          <Ionicons 
            name={icon as any} 
            size={22} 
            color={variant === 'destructive' ? '#FF3B30' : '#6A0DAD'} 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[
            styles.settingsTitle,
            variant === 'destructive' && styles.destructiveText
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingsSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.settingsItemRight}>
        {rightComponent}
        {showArrow && !rightComponent && (
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        )}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.headerEmail}>
            {currentUser?.email || 'admin@example.com'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Complex Management */}
        <SectionHeader title="Complex Management" />
        <View style={styles.section}>
          <SettingsItem
            icon="business-outline"
            title="Complex Setup"
            subtitle="Configure properties, units, and residents"
            onPress={() => Alert.alert('Feature', 'Navigate to complex configuration')}
          />
          
          <SettingsItem
            icon="people-outline"
            title="Resident Management"
            subtitle="Approve, manage, and monitor residents"
            onPress={() => router.push('/users')}
          />
          
          <SettingsItem
            icon="document-text-outline"
            title="Reports & Analytics"
            subtitle="View detailed reports and statistics"
            onPress={() => router.push('/report')}
          />
        </View>

        {/* App Configuration */}
        <SectionHeader title="App Configuration" />
        <View style={styles.section}>
          <SettingsItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive alerts for new reports and issues"
            onPress={() => toggleSetting('pushNotifications')}
            showArrow={false}
            rightComponent={
              <Switch
                value={settings.pushNotifications}
                onValueChange={() => toggleSetting('pushNotifications')}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#fff"
              />
            }
          />
          
          <SettingsItem
            icon="mail-outline"
            title="Email Reports"
            subtitle="Daily summary emails of platform activity"
            onPress={() => toggleSetting('emailReports')}
            showArrow={false}
            rightComponent={
              <Switch
                value={settings.emailReports}
                onValueChange={() => toggleSetting('emailReports')}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#fff"
              />
            }
          />
          
          <SettingsItem
            icon="checkmark-circle-outline"
            title="Auto Approval"
            subtitle="Automatically approve new resident registrations"
            onPress={() => toggleSetting('autoApproval')}
            showArrow={false}
            rightComponent={
              <Switch
                value={settings.autoApproval}
                onValueChange={() => toggleSetting('autoApproval')}
                trackColor={{ false: '#E5E5EA', true: '#FF9500' }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* System Settings */}
        <SectionHeader title="System Settings" />
        <View style={styles.section}>
          <SettingsItem
            icon="construct-outline"
            title="Maintenance Mode"
            subtitle="Temporarily disable app for residents"
            onPress={() => toggleSetting('maintenanceMode')}
            showArrow={false}
            rightComponent={
              <Switch
                value={settings.maintenanceMode}
                onValueChange={() => toggleSetting('maintenanceMode')}
                trackColor={{ false: '#E5E5EA', true: '#FF3B30' }}
                thumbColor="#fff"
              />
            }
          />
          
          <SettingsItem
            icon="moon-outline"
            title="Dark Mode"
            subtitle="Switch to dark theme"
            onPress={() => toggleSetting('darkMode')}
            showArrow={false}
            rightComponent={
              <Switch
                value={settings.darkMode}
                onValueChange={() => toggleSetting('darkMode')}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#fff"
              />
            }
          />
          
          <SettingsItem
            icon="cloud-upload-outline"
            title="Backup & Export"
            subtitle="Export data and create backups"
            onPress={() => Alert.alert('Backup', 'This would initiate a data backup process')}
          />
        </View>

        {/* Privacy & Legal */}
        <SectionHeader title="Privacy & Legal" />
        <View style={styles.section}>
          <SettingsItem
            icon="shield-outline"
            title="Privacy Settings"
            subtitle="Review data usage, permissions, and privacy"
            onPress={() => Alert.alert('Privacy', 'Open privacy settings')}
          />
          
          <SettingsItem
            icon="document-outline"
            title="Terms & Policies"
            subtitle="Read legal agreements and usage guidelines"
            onPress={() => Alert.alert('Terms', 'Open terms and policies')}
          />
          
          <SettingsItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => Alert.alert('Support', 'Contact support at support@example.com')}
          />
        </View>

        {/* Account Actions */}
        <SectionHeader title="Account" />
        <View style={styles.section}>
          <SettingsItem
            icon="key-outline"
            title="Change Password"
            subtitle="Update your account password"
            onPress={() => Alert.alert('Password', 'This would open password change screen')}
          />
          
          <SettingsItem
            icon="log-out-outline"
            title="Sign Out"
            subtitle="Sign out of your admin account"
            onPress={handleSignOut}
            variant="destructive"
          />
          
          <SettingsItem
            icon="trash-outline"
            title="Delete Account"
            subtitle="Permanently delete your account and all data"
            onPress={handleDeleteAccount}
            variant="destructive"
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>FlatShare Admin Panel</Text>
          <Text style={styles.appInfoText}>Version 1.0.0</Text>
          <Text style={styles.appInfoText}>Built for better community management</Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  headerInfo: {
    marginTop: 4,
  },
  headerEmail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6D6D72',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 25,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 0,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#C6C6C8',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  destructiveItem: {
    // No background change, just text color changes
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destructiveIconContainer: {
    backgroundColor: '#FFE5E5',
  },
  textContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 17,
    color: '#000',
    fontWeight: '400',
  },
  destructiveText: {
    color: '#FF3B30',
  },
  settingsSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  appInfoText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 4,
  },
  bottomSpacing: {
    height: 40,
  },
});