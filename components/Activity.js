import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const getIcon = (action) => {
  switch (action) {
    case 'check-in':
      return { name: 'login', color: '#4caf50', title: 'Checked In' };
    case 'check-out':
      return { name: 'logout', color: '#f44336', title: 'Checked Out'  };
    case 'shift-swap':
      return { name: 'swap-horiz', color: '#2196f3', title: 'Shift Swap' };
    case 'update-profile':
      return { name: 'person', color: '#cc990eff', title: 'Profile Update' };
    default:
      return { name: 'info', color: '#9e9e9e' }; 
  }
};

const ActivityItem = ({ action, date }) => {
  const icon = getIcon(action);
  //console.log(date);

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
        <Text style={{ fontWeight: '600', fontSize: 16 }}>{icon.title}</Text>
        <Text style={{ color: '#555', fontSize: 12 }}>
          {date}
        </Text>
      </View>
    </View>
  );
};

export default ActivityItem;
