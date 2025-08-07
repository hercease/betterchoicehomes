import React, { useEffect, useState } from 'react'; 
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/profilestyles';

const Profile = ({ navigation }) => {
  const [userData, setUserData] = useState({
    name: 'Michael Mirc',
    role: 'Lead UI/UX Designer'
  });

  const menuItems = [
    { 
      id: '1', 
      title: 'Edit Profile', 
      icon: 'create-outline', 
      action: () => navigation.navigate('EditProfile')
    },
    { 
      id: '2', 
      title: 'Account Settings', 
      icon: 'settings-outline',
      action: () => {} 
    },
    { 
      id: '3', 
      title: 'Notifications', 
      icon: 'notifications-outline',
      action: () => {} 
    },
    { 
      id: '4', 
      title: 'Terms & Privacy', 
      icon: 'shield-checkmark-outline',
      action: () => {} 
    },
    { 
      id: '5', 
      title: 'Log out', 
      icon: 'log-out-outline', 
      color: '#f44336',
      action: () => handleLogout()
    },
  ];

  const bottomTabs = [
    { id: 'home', icon: 'home', screen: 'Dashboard' },
    { id: 'calendar', icon: 'calendar', screen: 'Calendar' },
    { id: 'profile', icon: 'person', screen: 'Profile' },
  ];

  // Data loading effect
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('userProfile');
        if (storedData) {
          setUserData(JSON.parse(storedData));
        }
      } catch (error) {
        console.error('Failed to load user data', error);
        Alert.alert('Error', 'Failed to load profile data');
      }
    };

    const unsubscribe = navigation.addListener('focus', loadUserData);
    loadUserData();
    return unsubscribe;
  }, [navigation]);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout failed', error);
              Alert.alert('Error', 'Failed to log out');
            }
          }
        }
      ]
    );
  };

  const handleMenuItemPress = (item) => {
    item.action();
  };

  const handleTabPress = (tab) => {
    navigation.navigate(tab.screen);
  };

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={40} color="#fff" />
        </View>
        <Text style={styles.userName}>{userData.name}</Text>
        <Text style={styles.userRole}>{userData.role}</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handleMenuItemPress(item)}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons 
                name={item.icon} 
                size={22} 
                color={item.color || '#0b184d'} 
              />
              <Text style={styles.menuText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {bottomTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => handleTabPress(tab)}
          >
            <Ionicons
              name={tab.icon}
              size={24}
              color={tab.id === 'profile' ? '#f58634' : '#888'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default Profile;