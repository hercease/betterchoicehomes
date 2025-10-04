import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavBar from '../components/BottomNav';
import Storage from '../components/storage';
import Toast from 'react-native-toast-message';

export default function ProfilePage({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [userDocuments, setUserDocuments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Safe data getter with fallbacks
  const getSafeData = (key, fallback = 'Not provided') => {
    return userDocuments?.[key] || fallback;
  };

  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return `${names[0][0] || ''}${names[1][0] || ''}`.toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Not provided') return dateString;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await Storage.removeItem('userToken');
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const fetchUserDocuments = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const authToken = await Storage.getItem('userToken');
      
      if (!authToken) {
        navigation.replace('Login');
        return;
      }

      const params = new URLSearchParams();
      params.append('email', authToken);
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      
      const response = await fetch(`${apiUrl}/fetchprofileinfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      
      if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
     
      const data = await response.json();
      
      if (data.status) {
        setUserDocuments(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch profile data');
      }
      
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message);
      Toast.show({
        type: 'error',
        text1: 'Failed to load profile',
        text2: error.message
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserDocuments();
    });
    
    return unsubscribe;
  }, [fetchUserDocuments, navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserDocuments();
  };

  const InfoRow = ({ label, value, isSensitive = false, isDate = false }) => (
    <View style={styles.infoGroup}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[
        styles.infoText,
        value === 'Not provided' && styles.notProvidedText,
        isSensitive && styles.sensitiveText
      ]}>
        {isDate ? formatDate(value) : value}
        {isSensitive && <Text style={styles.asterisk}> *</Text>}
      </Text>
    </View>
  );

  const DocumentItem = ({ doc, index }) => (
    <TouchableOpacity 
      style={styles.documentItem}
      onPress={() => {
        // You could add functionality to view/download documents
        Alert.alert(
          doc.title,
          `File: ${doc.file_name}\nStatus: ${doc.isApproved ? 'Approved' : 'Pending Approval'}`,
          [
            { text: 'OK', style: 'default' },
            doc.file_url && { 
              text: 'View Document', 
              onPress: () => Linking.openURL(doc.file_url) 
            }
          ].filter(Boolean)
        );
      }}
    >
      <View style={styles.documentInfo}>
        <Text style={styles.documentTitle}>{doc.title}</Text>
        <Text style={styles.documentFileName}>{doc.file_name}</Text>
      </View>
      <Ionicons
        name={doc.isApproved ? 'checkmark-circle' : 'time-outline'}
        size={22}
        color={doc.isApproved ? '#4CAF50' : '#FFA000'}
      />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#f58634" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="warning-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorTitle}>Failed to load profile</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserDocuments}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullName = `${getSafeData('firstname')} ${getSafeData('lastname')}`.trim();

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarSection}>
            <View style={styles.initialsAvatar}>
              <Text style={styles.initialsText}>
                {getInitials(fullName)}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{fullName || 'User'}</Text>
              <Text style={styles.userEmail}>{getSafeData('email')}</Text>
              <Text style={styles.userRole}>{getSafeData('role', 'Employee')}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#ffffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#f58634']}
            tintColor="#f58634"
          />
        } 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Personal Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={18} color="#0b184d" />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>
          
          <InfoRow label="First Name" value={getSafeData('firstname')} />
          <InfoRow label="Last Name" value={getSafeData('lastname')} />
          <InfoRow label="Email" value={getSafeData('email')} />
          <InfoRow label="Contact Number" value={getSafeData('contact_number')} />
          <InfoRow label="Date of Birth" value={getSafeData('dob')} isDate />
          <InfoRow label="Address" value={getSafeData('address')} />
        </View>

        {/* Bank Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="business-outline" size={18} color="#0b184d" />
            <Text style={styles.cardTitle}>Bank Information</Text>
          </View>
          
          <InfoRow label="Account Number" value={getSafeData('account_number')} isSensitive />
          <InfoRow label="Transit Number" value={getSafeData('transit_number')} />
          <InfoRow label="Institution Number" value={getSafeData('institution_number')} />
          <InfoRow label="SIN" value={getSafeData('sin')} isSensitive />
        </View>

        {/* Driver License Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="car-outline" size={18} color="#0b184d" />
            <Text style={styles.cardTitle}>Driver License Information</Text>
          </View>
          
          <InfoRow label="License Number" value={getSafeData('driver_license_number')} isSensitive />
          <InfoRow label="Expiry Date" value={getSafeData('driver_license_expiry_date')} isDate />
        </View>

        {/* Documents Card */}
        {userDocuments?.documents && userDocuments.documents.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text-outline" size={18} color="#0b184d" />
              <Text style={styles.cardTitle}>Uploaded Documents</Text>
            </View>
            
            {userDocuments.documents.map((doc, index) => (
              <DocumentItem key={`doc-${index}`} doc={doc} index={index} />
            ))}
            
            <Text style={styles.documentsNote}>
              {userDocuments.documents.filter(doc => doc.isApproved).length} of {userDocuments.documents.length} documents approved
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('EditProfile')} 
            style={[styles.actionButton, styles.editButton]}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  initialsAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f58634',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  initialsText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0b184d',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#f58634',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f58634',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 130,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0b184d',
    marginLeft: 8,
  },
  infoGroup: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  notProvidedText: {
    color: '#999',
    fontStyle: 'italic',
  },
  sensitiveText: {
    color: '#0b184d',
    fontWeight: '600',
  },
  asterisk: {
    color: '#f58634',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  documentFileName: {
    fontSize: 12,
    color: '#666',
  },
  documentsNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#f58634',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#0b184d',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#0b184d',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginTop: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0b184d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});