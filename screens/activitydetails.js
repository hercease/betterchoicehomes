// ActivityDetails.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ActivityDetails({ route, navigation }) {
  const { activity } = route.params;
  const iconData = getIcon(activity.action);

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Details</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {/* Content */}
      <View style={styles.card}>
        {/* Icon */}
        <View style={[styles.iconWrapper, { backgroundColor: `${iconData.color}20` }]}>
          <MaterialIcons name={iconData.name} size={36} color={iconData.color} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{iconData.title}</Text>

        {/* Date */}
        <View style={styles.dateWrapper}>
          <MaterialIcons name="event" size={16} color="#555" style={{ marginRight: 6 }} />
          <Text style={styles.date}>{activity.date}</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>{activity.description}</Text>
      </View>
    </View>
  );
}

const getIcon = (action) => {
  switch (action) {
    case 'check-in':
      return { name: 'login', color: '#4caf50', title: 'Checked In' };
    case 'check-out':
      return { name: 'logout', color: '#f44336', title: 'Checked Out' };
    case 'shift-swap':
      return { name: 'swap-horiz', color: '#2196f3', title: 'Shift Swap' };
    case 'update-document':
      return { name: 'description', color: '#cc990eff', title: 'Document Update' };
    default:
      return { name: 'info', color: '#9e9e9e', title: 'Info' };
  }
};

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
    card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0b184d',
    marginBottom: 8,
  },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef1f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  date: {
    fontSize: 14,
    color: '#555',
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
});
