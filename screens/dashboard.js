import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView,
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/dashboardstyles';
import DynamicSwipeButton from '../components/DynamicSwipeButton';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [attendance, setAttendance] = useState({
    isCheckedIn: false,
    checkInTime: null,
    checkOutTime: null
  });

  const activityData = [
    { id: '1', title: 'Checked In', time: '9:00 AM' },
    { id: '2', title: 'Break Started', time: '12:00 PM' },
    { id: '3', title: 'Break Ended', time: '12:30 PM' },
    { id: '4', title: 'Checked Out', time: '5:00 PM' },
  ];

  const dateItems = [
    { id: '1', day: '06', weekday: 'Thu' }, 
    { id: '2', day: '07', weekday: 'Fri' },
    { id: '3', day: '08', weekday: 'Sat' },
    { id: '4', day: '09', weekday: 'Sun' },
    { id: '5', day: '10', weekday: 'Mon' },
    { id: '6', day: '11', weekday: 'Tue' },
    { id: '7', day: '09', weekday: 'Wed' },
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
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.dateScroll}
        contentContainerStyle={styles.dateScrollContent}
      >
        {dateItems.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[
              styles.dateItem, 
              item.id === '2' && styles.activeDate
            ]}
          >
            <Text style={styles.dateDay}>{item.day}</Text>
            <Text style={[
              styles.dateWeekday,
              item.id === '2' && styles.activeDateText
            ]}>{item.weekday}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Today Attendance */}
      <Text style={styles.sectionTitle}>Today Attendance</Text>
      
      <View style={styles.cardRow}>
        <View style={styles.attendanceCard}>
          <Ionicons 
            name="log-in-outline" 
            size={20} 
            color={attendance.checkInTime ? "#4CAF50" : "#888"} 
          />
          <Text style={styles.cardTitle}>Check In</Text>
          <Text style={styles.cardValue}>
            {attendance.checkInTime || "--:--"}
          </Text>
          {attendance.checkInTime && (
            <Text style={styles.cardSub}>On Time</Text>
          )}
        </View>

        <View style={styles.attendanceCard}>
          <Ionicons 
            name="log-out-outline" 
            size={20} 
            color={attendance.checkOutTime ? "#F44336" : "#888"} 
          />
          <Text style={styles.cardTitle}>Check Out</Text>
          <Text style={styles.cardValue}>
            {attendance.checkOutTime || "--:--"}
          </Text>
        </View>
      </View>

      {/* Total Days Card */}
      <View style={styles.singleCardRow}>
        <View style={[styles.attendanceCard, styles.widerCard]}>
          <Ionicons name="calendar-outline" size={20} color="#2979FF" />
          <Text style={styles.cardTitle}>Total Days</Text>
          <Text style={styles.cardValue}>28</Text>
          <Text style={styles.cardSub}>Working Days</Text>
        </View>
      </View>

      {/* Your Activity */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Activity</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.activityContainer}
        contentContainerStyle={styles.activityContent}
        nestedScrollEnabled={true}
      >
        {activityData.map((item) => (
          <View key={item.id} style={styles.activityCard}>
            <View style={styles.iconWrapper}>
              <Ionicons
                name={item.title.includes('Check') ? "log-in-outline" : "cafe-outline"}
                size={20}
                color="#0b184d"
              />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.activityDate}>April 17, 2023</Text>
            </View>
            <View style={styles.activityTimeBlock}>
              <Text style={styles.activityTime}>{item.time}</Text>
              <Text style={styles.activityStatus}>On Time</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Dynamic Swipe Button */}
      <DynamicSwipeButton 
        attendance={attendance}
        setAttendance={setAttendance}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Ionicons name="home" size={24} color="#f58634" />
        <Ionicons name="calendar" size={24} color="#ccc" />
        <Ionicons name="people" size={24} color="#ccc" />
        <Ionicons name="person" size={24} color="#ccc" />
      </View>
    </View>
  );
}