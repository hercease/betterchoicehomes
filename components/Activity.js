import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

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

const ActivityItem = ({ action, date, onPress }) => {
  const icon = getIcon(action);

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
      activeOpacity={0.7}
    >
      <MaterialIcons
        name={icon.name}
        size={24}
        color={icon.color}
        style={{ marginRight: 12 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '600', fontSize: 16 }}>
          {icon.title}
        </Text>
        <Text style={{ color: '#555', fontSize: 12 }}>
          {date}
        </Text>
      </View>
      {/* Optional: Add a chevron to indicate it's tappable */}
      <MaterialIcons
        name="chevron-right"
        size={20}
        color="#999"
      />
    </TouchableOpacity>
  );
};

export default ActivityItem;