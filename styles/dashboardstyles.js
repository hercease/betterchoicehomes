import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

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
    marginBottom: 20,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0b184d',
  },
  userRole: {
    fontSize: 14,
    color: '#888',
  },
  bellContainer: {
    padding: 5,
  },
  dateScroll: {
    marginTop: 10,
    marginBottom: 25,  // Increased from 20 to create more space
    maxHeight: 70,
    paddingBottom: 70,  // Prevent vertical expansion
  },
  dateScrollContent: {
    paddingHorizontal: 8,
    paddingBottom: 10, // Ensure first/last items aren't cut off
  },
  dateItem: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eee',
    borderRadius: 12,
    width: 55, // Fixed width for uniform circles
    height: 60, // Taller to accommodate 2 lines
    marginRight: 10,
    paddingVertical: 8,
  },
  dateDay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0b184d',
  },
  dateWeekday: {
    fontSize: 12,
    color: '#888',
    marginTop: 2, // Space between day and weekday
  },
  activeDate: {
    backgroundColor: '#f58634',
  },
  dateText: {
    fontSize: 14,
    color: '#0b184d',
  },
  activeDateText: {
    color: '#fff', // Applies to weekday when active
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  singleCardRow: {
    flexDirection: 'row',
    justifyContent: 'center', // Centers the single card
    marginBottom: 10,
  },
  attendanceCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    width: width * 0.44,
  },
  widerCard: {
    width: width * 0.8, // Wider for single prominent card
  },
  cardTitle: {
    fontSize: 14,
    color: '#888',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0b184d',
    marginTop: 4,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#0b184d',
  },
  activityList: {
    marginBottom: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activityText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#888',
  },
  swipeContainer: {
    height: 60,
    width: '90%', // Matches containerWidth calculation
    alignSelf: 'center',
    marginVertical: 10,
    position: 'relative',
    },
  swipeBackground: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeBackgroundText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },
  swipeButton: {
    height: 60,
    width: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 10,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0b184d',
    marginLeft: 16,
    marginTop: 15,      // Added top margin
    marginBottom: 15,
  },
  
  cardSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0b184d',
  },
  viewAll: {
    fontSize: 14,
    color: '#f58634',
    fontWeight: '500',
  },

  activityContainer: {
    height: 220, // Shows ~3-4 items (adjust based on your item height)
    marginHorizontal: 5,
    marginTop: 10,
    marginBottom: 20,
  },
  activityScroll: {
    flex: 1,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrapper: {
    backgroundColor: '#eaf1ff',
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0b184d',
  },
  activityDate: {
    fontSize: 12,
    color: '#7a7a7a',
    marginTop: 2,
  },
  activityTimeBlock: {
    alignItems: 'flex-end',
  },
  activityTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0b184d',
  },
  activityStatus: {
    fontSize: 12,
    color: '#7a7a7a',
    marginTop: 2,
  },
  
  
});

export default styles;
