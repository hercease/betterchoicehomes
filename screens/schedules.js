import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Storage from '../components/storage';
import Toast from 'react-native-toast-message';
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
        
        // Format marked dates with background colors instead of dots
        const formattedDates = {};
        const today = moment().format('YYYY-MM-DD');
        
        Object.keys(data.data.marked_dates).forEach(date => {
          let backgroundColor;
          
          if (date === today) {
            // Today - blue color
            backgroundColor = '#2196F3';
          } else if (moment(date).isBefore(today)) {
            // Past dates - yellow color
            backgroundColor = '#4CAF50';
          } else {
            // Future dates - green color
            backgroundColor = '#FFEB3B';
          }
          
          formattedDates[date] = {
            selected: true,
            selectedColor: backgroundColor,
            customStyles: {
              container: {
                backgroundColor: backgroundColor,
                borderRadius: 20,
              },
              text: {
                color: date === today ? '#FFFFFF' : '#000000',
                fontWeight: 'bold',
              }
            }
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

      {/* Calendar with colored dates */}
      <Calendar
        current={moment().format('YYYY-MM-DD')}
        markedDates={markedDates}
        onMonthChange={handleMonthChange}
        onDayPress={(day) => {
          const dailySchedules = getDailySchedules(day.dateString);
          if (dailySchedules.length > 0) {
            navigation.navigate('ScheduleDetails', { 
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
          textSectionTitleColor: '#0b184d',
          selectedDayBackgroundColor: '#0b184d',
          selectedDayTextColor: '#ffffff',
        }}
        markingType={'custom'}
        dayComponent={({ date, state, marking }) => {
          return (
            <TouchableOpacity 
              style={[
                styles.dayContainer,
                marking?.customStyles?.container,
                state === 'today' && !marking && styles.todayContainer
              ]}
              onPress={() => {
                const dailySchedules = getDailySchedules(date.dateString);
                if (dailySchedules.length > 0) {
                  navigation.navigate('ScheduleDetails', { 
                    date: date.dateString,
                    schedules: dailySchedules 
                  });
                }
              }}
            >
              <Text style={[
                styles.dayText,
                state === 'disabled' && styles.disabledText,
                marking?.customStyles?.text,
                state === 'today' && !marking && styles.todayText
              ]}>
                {date.day}
              </Text>
            </TouchableOpacity>
          );
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
                onRefresh={fetchSchedules}
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
  dayContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    margin: 2,
  },
  dayText: {
    fontSize: 12,
    textAlign: 'center',
  },
  disabledText: {
    color: '#bbb',
  },
  todayContainer: {
    backgroundColor: '#f58634',
    borderRadius: 18,
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold',
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
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0b184d',
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