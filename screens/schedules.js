// Schedules.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { API_URL } from '@env';
import Storage from '../components/storage';
import Toast from 'react-native-toast-message';
import  ScheduleCalendar  from '../components/schedulecalendar'
import { Calendar, LocaleConfig } from 'react-native-calendars';
import moment from 'moment';
import { useFocusEffect } from '@react-navigation/native';


LocaleConfig.locales['en'] = {
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  monthNamesShort: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  today: 'Today'
};
LocaleConfig.defaultLocale = 'en';

export default function ScheduleScreen({ navigation }) {

  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [markedDates, setMarkedDates] = useState({});
  const [currentMonth, setCurrentMonth] = useState(moment().format('YYYY-MM'));
   const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  //const navigation = useNavigation();

   // Fetch schedules from API
  const fetchSchedules = async () => {
    try {
            setError(null);
            setRefreshing(true);
            params = new URLSearchParams();
            params.append('email', email);
            params.append('month', currentMonth);
            const apiUrl = process.env.EXPO_PUBLIC_API_URL;
            const response = await fetch(`${apiUrl}/fetchmonthlyschedules`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: params.toString()
            });

            const data = await response.json();

                if (data.status) {

                    setSchedules(data.data.schedules);
          
                    // Format marked dates for calendar
                    const formattedDates = {};
                    Object.keys(data.data.marked_dates).forEach(date => {
                        formattedDates[date] = {
                        marked: true,
                        dotColor: data.data.marked_dates[date].count > 1 ? '#FF5722' : '#4CAF50',
                        activeOpacity: 0.3,
                        };
                    });
                    setMarkedDates(formattedDates);
                }

            } catch (error) {
                setError(error.message);
                console.error('Error fetching schedules:', error);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
  };

      // Load user email once on mount
    useEffect(() => {
        const loadEmail = async () => {
            const userEmail = await Storage.getItem('userToken');
            if (!userEmail) {
                navigation.replace('Login');
                return;
            }
            setEmail(userEmail);
        };
        loadEmail();
    }, []);

    // Fetch activities when email is available
    useEffect(() => {
        if (email) {
            fetchSchedules();
        }
    }, [currentMonth, email]);

     // Refresh when screen comes into focus
    /*useFocusEffect(
        useCallback(() => {
        if (email) fetchSchedules();
        }, [email, fetchSchedules])
    );*/

    // Navigate to day detail
    const handleDayPress = (day) => {
        const dailySchedules = schedules.filter(s => s.date === day.dateString);
        if (dailySchedules.length > 0) {
        navigation.navigate('ScheduleDetail', { 
            date: day.dateString,
            schedules: dailySchedules 
        });
        }
    };

    // Manual refresh
    const handleRefresh = () => {
        if (!refreshing) fetchSchedules();
    };

    // Handle month change
    const handleMonthChange = (month) => {
        setCurrentMonth(moment(month.dateString).format('YYYY-MM'));
        fetchSchedules();
    };

    // Get schedules for selected date
    const getDailySchedules = (date) => {
        return schedules.filter(s => s.date === date);
    };

     // Render each schedule item
    const renderScheduleItem = ({ item }) => (
        <TouchableOpacity
        style={styles.scheduleCard}
        onPress={() => navigation.navigate('ScheduleDetails', { 
            date: item.date,
            schedules: [item] 
        })}
        >
        <Text style={styles.dateHeader}>
            {moment(item.date).format('dddd, MMMM D')}
        </Text>
        <Text style={styles.timeText}>
            {item.start_time} - {item.end_time}
        </Text>
        <Text style={styles.payText}>
            ${item.pay_per_hour}/hr (${item.expected_pay})
        </Text>
        {item.clockin && (
            <Text style={styles.clockText}>
            ⏱️ Clocked: {item.clockin} - {item.clockout || 'Not clocked out'}
            </Text>
        )}
        </TouchableOpacity>
    );


    console.log("schedule date",schedules)

    if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

   

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My schedule</Text>
        <View style={{ width: 24 }} /> 
      </View>

        {/* schedule calendar */}
        <Calendar
            current={moment().format('YYYY-MM-DD')}
            markedDates={markedDates}
            onMonthChange={handleMonthChange}
            onDayPress={(day) => {
            const dailySchedules = getDailySchedules(day.dateString);
            if (dailySchedules.length > 0) {
                navigation.navigate('ScheduleDetail', { 
                date: day.dateString,
                schedules: dailySchedules 
                });
            }
            }}
            theme={{
            calendarBackground: '#fff',
            todayTextColor: '#f58634',
            dayTextColor: '#333',
            monthTextColor: '#0b184d',
            arrowColor: '#0b184d',
            }}
        />

        <View style={styles.listContainer}>
        <Text style={styles.monthTitle}>
          {moment(currentMonth).format('MMMM YYYY')} Schedules
        </Text>
        
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#0b184d" style={styles.loader} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity onPress={fetchSchedules} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
             

            <FlatList
                data={schedules}
                keyExtractor={(item) => `${item.id}_${item.date}_${item.start_time}`}
                renderItem={renderScheduleItem}
                showsVerticalScrollIndicator={false}
                refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={['#0b184d']}
                    tintColor="#0b184d"
                />
                }
                ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>📅 No schedules found this month</Text>
                    <Text style={styles.emptySubtext}>Pull down to refresh</Text>
                </View>
                }
                contentContainerStyle={schedules.length === 0 && styles.emptyListContainer}
            />
        )}
        </View>

      
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0b184d',
  },
   scheduleContainer: {
    padding: 16
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0b184d',
    marginBottom: 16
  },
  scheduleItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0b184d'
  },
  scheduleHours: {
    fontSize: 14,
    color: '#666'
  },
  scheduleDetails: {
    marginTop: 8
  },
  scheduleDetail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4
  },
  noSchedules: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20
  },

   listContainer: { marginTop: 20 },
  monthTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  scheduleCard: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
  },
  dateHeader: {
    fontWeight: 'bold',
    marginBottom: 5
  },
  clockText: {
    color: '#666',
    marginTop: 3
  },
  calendar: {
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dateHeader: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    color: '#0b184d',
  },
  timeText: {
    color: '#555',
    marginBottom: 3,
  },
  payText: {
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 3,
  },
  clockText: {
    color: '#666',
    fontStyle: 'italic',
  },
  loader: {
    marginTop: 40,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#F44336',
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0b184d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  emptyListContainer: {
    justifyContent: 'center',
  },
});
