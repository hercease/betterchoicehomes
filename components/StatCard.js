import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const StatCard = ({ icon, label, value, color1, color2 }) => {
  return (
    <LinearGradient
      colors={[color1, color2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flex: 1,
        margin: 8,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <MaterialIcons name={icon} size={28} color="#fff" />
      <Text style={{ fontSize: 14, color: '#fff', marginTop: 8 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 20, color: '#fff', fontWeight: 'bold' }}>
        {value}
      </Text>
    </LinearGradient>
  );
};

export default StatCard;
