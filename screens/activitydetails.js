import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Animated,
  Easing
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment'; // Consider adding moment.js for better date formatting

export default function ActivityDetails({ route, navigation }) {
  const { activity } = route.params;
  const iconData = getIcon(activity.action);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleBack = () => {
    // Exit animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => navigation.goBack());
  };

  return (
    <View style={styles.container}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={['#0b184d', '#1a3a8f']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Details</Text>
        <View style={{ width: 24 }} /> 
      </LinearGradient>

      {/* Content with animations */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.card,
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }] 
            }
          ]}
        >
          {/* Icon with gradient background */}
          <LinearGradient
            colors={[iconData.color, lightenColor(iconData.color, 20)]}
            style={styles.iconWrapper}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name={iconData.name} size={36} color="#fff" />
          </LinearGradient>

          {/* Title */}
          <Text style={styles.title}>{iconData.title}</Text>

          {/* Date with improved formatting */}
          <View style={styles.dateWrapper}>
            <MaterialIcons name="event" size={18} color="#666" style={styles.dateIcon} />
            <Text style={styles.date}>
              {activity.date}
            </Text>
          </View>

          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: `${iconData.color}20` }]}>
            <Text style={[styles.statusText, { color: iconData.color }]}>
              {activity.status || 'Completed'}
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description with improved typography */}
          <Text style={styles.description}>{activity.description}</Text>

          {/* Additional details section */}
          {activity.details && (
            <>
              <Text style={styles.sectionTitle}>Additional Details</Text>
              <View style={styles.detailsContainer}>
                {Object.entries(activity.details).map(([key, value]) => (
                  <View key={key} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{key}:</Text>
                    <Text style={styles.detailValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// Helper function to lighten colors
const lightenColor = (color, percent) => {
  // This is a simplified version - consider using a proper color library
  return color; // In a real app, implement proper color manipulation
};

const getIcon = (action) => {
  switch (action) {
    case 'check-in':
      return { name: 'login', color: '#4caf50', title: 'Checked In' };
    case 'generate-schedule-form':
      return { name: 'calendar-today', color: '#ff9800', title: 'Generate Schedule Form' };
    case 'insert-schedule':
      return { name: 'post-add', color: '#2196f3', title: 'Insert Schedule' };
    case 'delete-user':
      return { name: 'person-remove', color: '#f44336', title: 'Delete User' };
    case 'update-user':
      return { name: 'person-outline', color: '#ffeb3b', title: 'Update User' };
    case 'update-schedule':
      return { name: 'edit-calendar', color: '#9c27b0', title: 'Update Schedule' };
    case 'register-user':
      return { name: 'person-add', color: '#3f51b5', title: 'Register User' };
    case 'check-out':
      return { name: 'logout', color: '#f44336', title: 'Checked Out' };
    case 'shift-swap':
      return { name: 'swap-horiz', color: '#8bc34a', title: 'Shift Swap' };
    case 'update-profile':
      return { name: 'manage-accounts', color: '#cc990eff', title: 'Profile Update' };
    default:
      return { name: 'info', color: '#9e9e9e', title: 'Activity' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0b184d',
  },
  /*: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },*/
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  iconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0b184d',
    marginBottom: 8,
    textAlign: 'center',
  },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  dateIcon: {
    marginRight: 8,
  },
  date: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0b184d',
    marginBottom: 12,
  },
  detailsContainer: {
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});