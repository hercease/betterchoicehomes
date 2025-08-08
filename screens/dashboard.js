import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/dashboardstyles';
import BottomNavBar from '../components/BottomNav';
import StatCard from '../components/StatCard';
import ActivityItem from '../components/Activity';
import CheckInOutCard from '../components/CheckInOutCard';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {

  const [attendance, setAttendance] = useState({
    isCheckedIn: false,
    checkInTime: null,
    checkOutTime: null
  });

  const [refreshing, setRefreshing] = useState(false);

  const handleCheckInOut = () => {
    setIsCheckedIn(!isCheckedIn);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000); // simulate refresh
  };

  const userActivities = [
    {
      type: 'checkin',
      title: 'Checked In',
      date: 'Aug 7, 2025',
      time: '08:00 AM',
    },
    {
      type: 'checkout',
      title: 'Checked Out',
      date: 'Aug 7, 2025',
      time: '04:00 PM',
    },
    {
      type: 'shift_swap',
      title: 'Shift Swapped',
      date: 'Aug 6, 2025',
      time: '12:00 PM',
    },
    {
      type: 'other',
      title: 'Unknown Activity',
      date: 'Aug 5, 2025',
      time: '03:30 PM',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={{ uri: 'https://i.pravatar.cc/100' }} style={styles.profileImage} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Hi, John</Text>
          <Text style={styles.userRole}>Employee</Text>
        </View>
        <TouchableOpacity style={styles.bellContainer}>
          <Ionicons name="notifications-outline" size={24} color="#0b184d" />
        </TouchableOpacity>
      </View>

      {/* Date Scroll */}
      <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      >

      {/* Today Attendance */}
      <Text padding={16} style={styles.sectionTitle}>Stat this month</Text>

       <View style={{ flexDirection: 'row' }}>
        <StatCard
          icon="calendar-today"
          label="Days Attended"
          value="20 Days"
          color1="#6a11cb"
          color2="#2575fc"
        />
        <StatCard
          icon="access-time"
          label="Total Hours"
          value="160 hrs"
          color1="#a16010ff"
          color2="#ffd200"
        />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <StatCard
          icon="payments"
          label="Total Pay"
          value="$120,000"
          color1="#00c6ff"
          color2="#0f58b1ff"
        />
        <StatCard
          icon="trending-up"
          label="Overtime"
          value="15 hrs"
          color1="#11998e"
          color2="#38ef7d"
        />
      </View>

      <CheckInOutCard />

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


      <View marginBottom={100}>
        
          {userActivities.map((activity, index) => (
            <ActivityItem key={index} {...activity} />
          ))}
    </View>

     </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar navigation={navigation} />
    </View>
  );
}