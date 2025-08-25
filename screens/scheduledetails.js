import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Linking,
  Share
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import moment from 'moment';

const ScheduleDetailScreen = ({ route, navigation }) => {
  const { date, schedules } = route.params;

  console.log(schedules[0].shift_type);
  
  // Calculate totals for the day
  const dailyTotals = schedules.reduce((acc, curr) => {
    const hours = moment.duration(moment(curr.clockout, 'HH:mm').diff(moment(curr.clockin, 'HH:mm'))).asHours();
    return {
      totalHours: acc.totalHours + hours,
      totalPay: acc.totalPay + (hours * curr.pay_per_hour)
    };
  }, { totalHours: 0, totalPay: 0 });

  // Share schedule details
  const handleShare = async () => {
    try {
      const message = `My schedule for ${moment(date).format('MMMM D, YYYY')}:\n\n` +
        schedules.map(s => (
          `${s.shift_type} ${s.shift_type == 'overnight' ? `(${s.overnight_type})` : ''}\n` +
          `${s.start_time} - ${s.end_time}\n` +
          `Pay: $${s.pay_per_hour}/hr\n` +
          `${s.clockin ? `Clocked: ${s.clockin} - ${s.clockout || 'Not out'}` : 'Not clocked in'}\n`
        )).join('\n') +
        `\nTotal: ${schedules[0].total_hours} hrs | CAD ${schedules.total_pay ? schedules[0].total_pay.toFixed(2) : 0}`;

      await Share.share({
        message,
        title: 'My Schedule'
      });
    } catch (error) {
      console.error('Sharing failed:', error);
    }
  };

  // Open navigation to location
  const handleNavigate = (location) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`;
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {moment(date).format('dddd, MMMM D')}
        </Text>
        <TouchableOpacity onPress={handleShare}>
          <MaterialIcons name="share" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Pay/hr</Text>
          <Text style={styles.summaryValue}>CAD {schedules[0].pay_per_hour}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Hours</Text>
          <Text style={styles.summaryValue}>{schedules[0].total_hours}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expected Pay</Text>
          <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
            CAD {schedules[0].expected_pay}
          </Text>
        </View>
      </View>

      {/* Each Schedule */}
      {schedules.map((schedule, index) => (
        <View key={`${schedule.id}_${index}`} style={styles.scheduleCard}>
          {/* Schedule Header */}
          <View style={styles.scheduleHeader}>
            <Text style={styles.scheduleTitle}>{schedule.shift_type}{schedule.shift_type == 'overnight' ? `(${schedule.overnight_type})` : ''}</Text>
            
          </View>

          {/* Time Section */}
          <View style={styles.timeSection}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>Scheduled</Text>
              <Text style={styles.timeValue}>
                {schedule.start_time} - {schedule.end_time}
              </Text>
            </View>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>Actual</Text>
              <Text style={[
                styles.timeValue,
                !schedule.clockin && { color: '#F44336' }
              ]}>
                {schedule.clockin 
                  ? `${schedule.clockin} - ${schedule.clockout || 'Not out'}` 
                  : 'Not clocked in'}
              </Text>
            </View>
          </View>

          {/* Hours Calculation */}
          <View style={styles.hoursSection}>
            <View style={styles.hoursBlock}>
              <Text style={styles.hoursLabel}>Hours Worked</Text>
              <Text style={styles.hoursValue}>
                CAD {schedule.clockin ? schedule.hours_worked : 0.00}
              </Text>
            </View>
            <View style={styles.hoursBlock}>
              <Text style={styles.hoursLabel}>Earnings</Text>
              <Text style={[styles.hoursValue, { color: '#4CAF50' }]}>
                CAD {schedule.total_pay ? schedule.total_pay : 0}
              </Text>
            </View>
          </View>

          {/* Location (if available) */}
          {schedule.location && (
            <TouchableOpacity 
              style={styles.locationButton}
              onPress={() => handleNavigate(schedule.location)}
            >
              <FontAwesome name="map-marker" size={16} color="#0b184d" />
              <Text style={styles.locationText}>{schedule.location}</Text>
              <MaterialIcons name="chevron-right" size={20} color="#0b184d" />
            </TouchableOpacity>
          )}

          {/* Notes (if available) */}
          {schedule.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{schedule.notes}</Text>
            </View>
          )}
        </View>
      ))}

      {/* Footer Space */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0b184d',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryItem: {
    alignItems: 'left',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0b184d',
    marginTop: 4,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0b184d',
    textTransform: 'capitalize'
  },
  schedulePay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  timeSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timeBlock: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  hoursSection: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  hoursBlock: {
    flex: 1,
  },
  hoursLabel: {
    fontSize: 12,
    color: '#999',
  },
  hoursValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0b184d',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
    color: '#0b184d',
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default ScheduleDetailScreen;