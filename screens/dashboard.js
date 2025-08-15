import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/dashboardstyles';
import BottomNavBar from '../components/BottomNav';
import StatCard from '../components/StatCard';
import ActivityItem from '../components/Activity';
import CheckInOutCard from '../components/CheckInOutCard';
import Storage from '../components/storage';
import { API_URL, APP_NAME } from '@env';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

// Default user data to prevent undefined errors
const DEFAULT_USER_DATA = {
  firstname: '',
  lastname: '',
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
    if (!fullName) return '';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || '';
    return `${names[0][0] || ''}${names[1][0] || ''}`.toUpperCase();
  }, []);

  const loadEmail = useCallback(async () => {
    try {
      const userEmail = await Storage.getItem('userToken');
      if (userEmail) {
        setEmail(userEmail);
      }
    } catch (error) {
      console.error('Failed to load email', error);
    }
  }, []);

  useEffect(() => {
    loadEmail();
  }, [loadEmail]);

  const handleLogout = async () => {
    try {
      await Storage.removeItem('userToken');
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
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
      
      const response = await fetch(`${API_URL}/fetchprofileinfo`, {
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
  }, [API_URL, navigation]);

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
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>Failed to load data</Text>
        <Text style={styles.errorSubText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchUserDocuments}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.initialsAvatar}>
          <Text style={styles.initialsText}>
            {getInitials(`${userDocuments.firstname} ${userDocuments.lastname}`)}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            Hi, {`${userDocuments.firstname} ${userDocuments.lastname}`}
          </Text>
          <Text style={styles.userRole}>Staff</Text>
        </View>
        <TouchableOpacity 
          style={styles.bellContainer}
          onPress={handleLogout}
        >
          <Ionicons name="power-outline" size={24} color="#0b184d" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#0b184d']}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      >
        {/* Today Attendance */}
        <Text style={styles.sectionTitle}>Stat this month</Text>

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
            color1="#11998e"
            color2="#38ef7d"
          />
        </View>

        <CheckInOutCard email={email} />

        {/* Your Activity */}
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
          {userDocuments.activities.length > 0 ? (
            userDocuments.activities.map((activity, index) => (
              <ActivityItem key={`activity-${index}`} {...activity} />
            ))
          ) : (
            <Text style={styles.noActivitiesText}>No activities found</Text>
          )}
        </View>
      </ScrollView>

      <BottomNavBar navigation={navigation} />
    </View>
  );
}