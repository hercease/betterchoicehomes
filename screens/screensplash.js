import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';

export default function SplashScreenPage({ navigation }) {
  useEffect(() => {
    let isMounted = true;

    const prepareApp = async () => {
      try {
        // Keep splash screen visible
        await SplashScreen.preventAutoHideAsync();
        
        // Minimum display time (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if user is authenticated
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          if (isMounted) navigation.replace('Dashboard');
        } else {
          if (isMounted) navigation.replace('Login');
        }
  
      } catch (e) {
        console.error('Splash screen error:', e);
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

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/better-icon-removebg-preview.png')} 
        style={styles.logo} 
      />
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