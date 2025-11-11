import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import styles from '../styles/dashboardstyles';
import BottomNavBar from '../components/BottomNav';
import StatCard from '../components/StatCard';
import ActivityItem from '../components/Activity';
import CheckInOutCard from '../components/CheckInOutCard';
import Storage from '../components/storage';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

// Default user data to prevent undefined errors
const DEFAULT_USER_DATA = {
  firstname: '',
  lastname: '',
  role: '',
  stats: {
    total_days_attended: 0,
    total_hours: 0,
    total_expected_pay: 0,
    total_schedules: 0
  },
  activities: []
};

export default function DashboardScreen({ navigation }) {
  const [userDocuments, setUserDocuments] = useState(DEFAULT_USER_DATA);
  const [refreshing, setRefreshing] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getInitials = useCallback((fullName) => {
    if (!fullName) return 'U'; // Default to 'U' for User
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return `${names[0][0] || ''}${names[1][0] || ''}`.toUpperCase();
  }, []);

  const loadEmail = useCallback(async () => {
    try {
      const userEmail = await Storage.getItem('userToken');
      if (userEmail) {
        setEmail(userEmail);
      }else{
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('Failed to load email', error);
    }
  }, []);

  useEffect(() => {
    loadEmail();
  }, [loadEmail]);

  useEffect(() => {
    const setupPushNotifications = async () => {
      try {
        const email = await Storage.getItem('userToken');
        if (!email) return;

        if (Device.isDevice) {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;

          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }

          if (finalStatus !== 'granted') {
            console.log('Push notifications permission denied');
            return;
          }

          const token = (await Notifications.getExpoPushTokenAsync({ 
            projectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID 
          })).data;

          // Android channel
          if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
              name: 'default',
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#0e2bd17c',
            });
          }

          // Send to backend
          const params = new URLSearchParams();
          params.append('email', email);
          params.append('token', token);
          const apiUrl = process.env.EXPO_PUBLIC_API_URL;
          
          await fetch(`${apiUrl}/save_notification_token`, {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: params.toString(),
          });
        }
      } catch (error) {
        console.error('Push notification setup failed:', error);
        // Don't show error to user as this is not critical
      }
    };

    setupPushNotifications();
  }, []);

  const handleLogout = async () => {
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
              //console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const fetchUserDocuments = useCallback(async () => {
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
      
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
     
      const data = await response.json();
      
      if (data.status) {
        setUserDocuments({
          ...DEFAULT_USER_DATA,
          ...data.data,
          stats: {
            ...DEFAULT_USER_DATA.stats,
            ...(data.data.stats || {})
          },
          activities: data.data.activities || []
        });

        if(!data.data.isActive){
          navigation.navigate('EditProfile');
        }
      } else {
        throw new Error(data.message || 'Failed to fetch user data');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message);
      Toast.show({
        type: 'error',
        text1: 'Failed to load data',
        text2: error.message || 'Please check your connection and try again'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserDocuments();
  }, [fetchUserDocuments]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserDocuments();
    });
    
    return unsubscribe;
  }, [fetchUserDocuments, navigation]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0b184d" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading your data...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={errorStyles.container}>
        <Ionicons name="warning-outline" size={64} color="#d32f2f" />
        <Text style={errorStyles.errorText}>Failed to load data</Text>
        <Text style={errorStyles.errorSubText}>{error}</Text>
        <TouchableOpacity 
          style={errorStyles.retryButton}
          onPress={fetchUserDocuments}
        >
          <Text style={errorStyles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullName = `${userDocuments.firstname || ''} ${userDocuments.lastname || ''}`.trim();
  const userRole = userDocuments.role || 'Employee';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.initialsAvatar}>
          <Text style={styles.initialsText}>
            {getInitials(fullName)}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            Hi, {fullName || 'User'}
          </Text>
          <Text style={styles.userRole}>{userRole}</Text>
        </View>
        <TouchableOpacity 
          style={styles.bellContainer}
          onPress={handleLogout}
        >
          <Ionicons name="power-outline" size={24} color="#ffffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#0b184d']}
            tintColor="#0b184d"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      >
        {/* Stats Section */}
        <Text style={styles.sectionTitle}>Stats this month</Text>

        <View style={{ flexDirection: 'row' }}>
          <StatCard
            icon="calendar-today"
            label="Days Attended"
            value={`${userDocuments.stats.total_days_attended} Days`}
            color1="#6a11cb"
            color2="#2575fc"
          />
          <StatCard
            icon="access-time"
            label="Total Hours"
            value={`${userDocuments.stats.total_hours} hrs`}
            color1="#a16010ff"
            color2="#ffd200"
          />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <StatCard
            icon="payments"
            label="Total Pay"
            value={`CAD ${userDocuments.stats.total_expected_pay}`}
            color1="#00c6ff"
            color2="#0f58b1ff"
          />
          <StatCard
            icon="trending-up"
            label="Total schedule"
            value={`${userDocuments.stats.total_schedules}`}
            color1="#bcc4c3ff"
            color2="#9ea19fff"
          />
        </View>

        {/* Check In/Out Card */}
        <CheckInOutCard email={email} />

        {/* Activity Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Activities')}>
            <View style={styles.viewAllWrapper}>
              <Text style={styles.viewAll}>View All</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#f58634" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 100 }}>
          {userDocuments.activities && userDocuments.activities.length > 0 ? (
            userDocuments.activities.slice(0, 5).map((activity, index) => (
              <ActivityItem 
                key={`activity-${index}-${activity.id || index}`} 
                {...activity} 
              />
            ))
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Text style={{ color: '#666', marginTop: 10 }}>No activities found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNavBar navigation={navigation} />
    </View>
  );
}