import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BottomNavBar = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  const navItems = [
    { icon: 'home', label: 'Dashboard', screen: 'Dashboard' },
    { icon: 'person', label: 'Profile', screen: 'Profile' },
    { icon: 'calendar', label: 'Activities', screen: 'Activities' },
    { icon: 'settings', label: 'Settings', screen: 'Settings' },
    { icon: 'alarm', label: 'Schedules', screen: 'Schedules' },
  ];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 10 }]}>
      {navItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.navItem}
          onPress={() => navigation.navigate(item.screen)}
        >
          <Ionicons name={item.icon} size={24} color="white" />
          <Text style={styles.navText}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f58634',
    paddingVertical: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  navText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default BottomNavBar;