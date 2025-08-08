import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const activitiesData = [
  { id: '1', type: 'checkin', title: 'Checked in at Office', date: 'Aug 5, 2025', time: '09:02 AM' },
  { id: '2', type: 'checkout', title: 'Checked out from Office', date: 'Aug 5, 2025', time: '05:30 PM' },
  { id: '3', type: 'break', title: 'Break started', date: 'Aug 5, 2025', time: '01:00 PM' },
  { id: '4', type: 'resume', title: 'Resumed from break', date: 'Aug 5, 2025', time: '01:30 PM' },
];

const getIcon = (type) => {
  switch (type) {
    case 'checkin': return { name: 'login', color: '#4CAF50' };
    case 'checkout': return { name: 'logout', color: '#F44336' };
    case 'break': return { name: 'free-breakfast', color: '#FF9800' };
    case 'resume': return { name: 'play-arrow', color: '#2196F3' };
    default: return { name: 'info', color: '#9E9E9E' };
  }
};

const ActivityItem = ({ type, title, date, time, onPress }) => {
  const icon = getIcon(type);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
      }}
    >
      <MaterialIcons
        name={icon.name}
        size={24}
        color={icon.color}
        style={{ marginRight: 12 }}
      />
      <View>
        <Text style={{ fontWeight: '600', fontSize: 16 }}>{title}</Text>
        <Text style={{ color: '#555', fontSize: 12 }}>
          {date} • {time}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function ActivitiesScreen() {
  const navigation = useNavigation();



  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activities</Text>
      </View>

      {/* List */}
      <FlatList
        data={activitiesData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ActivityItem
            {...item}
            onPress={() => navigation.navigate('ActivityDetails', { activity: item })}
          />
        )}
      />
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
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  activityTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: '#0b184d',
  },
  activitySubtitle: {
    color: '#555',
    fontSize: 12,
  },
});
