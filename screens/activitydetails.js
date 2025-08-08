// ActivityDetails.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ActivityDetails({ route, navigation }) {
  const { activity } = route.params;
  const iconData = getIcon(activity.type);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: 100 }}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Details</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {/* Content */}
      <View style={{ padding: 16 }}>
        <MaterialIcons name={iconData.name} size={48} color={iconData.color} style={{ marginBottom: 16 }} />
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.date}>
          {activity.date} • {activity.time}
        </Text>
        <Text style={styles.description}>{activity.description}</Text>
      </View>
    </View>
  );
}

const getIcon = (type) => {
  switch (type) {
    case 'checkin':
      return { name: 'login', color: '#4caf50' };
    case 'checkout':
      return { name: 'logout', color: '#f44336' };
    case 'shift_swap':
      return { name: 'swap-horiz', color: '#2196f3' };
    default:
      return { name: 'info', color: '#9e9e9e' };
  }
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'absolute',
    top: 50,
    width: '100%',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  date: {
    color: '#555',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
});
