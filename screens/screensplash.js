import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';

export default function SplashScreenPage({ navigation }) {
    
  useEffect(() => {
    let isMounted = true;

    const prepareApp = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
        await new Promise(resolve => setTimeout(resolve, 10000)); // Simulated delay

        const token = await AsyncStorage.getItem('authToken');

        if (!token) {
          if (isMounted) navigation.replace('Login');
          return;
        }

        // 🔸 Simulated API response
        const res = {
          status: false, // change to true to test dashboard redirect
          user: {
            id: 1,
            name: 'John Doe',
          },
        };

        if (isMounted) {
          if (res.status === true) {
            navigation.replace('Dashboard');
          } else {
            navigation.replace('UpdateProfile');
          }
        }
      } catch (e) {
        console.error('Error during splash logic:', e);
        if (isMounted) navigation.replace('Login');
      } finally {
        if (isMounted) await SplashScreen.hideAsync();
      }
    };

    prepareApp();

    return () => {
      isMounted = false;
    };
  }, []);

  // Your programmatic splash screen UI
  return (
    <View style={styles.container}>
      <Image source={require('../assets/better-icon-removebg-preview.png')} style={styles.logo} />
      <Text style={styles.text}>Loading your experience...</Text>
      <ActivityIndicator size="large" color="#333" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  text: {
    color: '#000000ff',
    marginBottom: 20,
    fontSize: 18,
  },
});
