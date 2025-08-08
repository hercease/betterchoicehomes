import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

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

const ActivityItem = ({ type, title, date, time }) => {
  const icon = getIcon(type);


  return (
    <View
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
    </View>
  );
};

export default ActivityItem;
