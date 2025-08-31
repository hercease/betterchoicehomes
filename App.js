import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import toastConfig from './components/toastConfig';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Storage from './components/storage';

// Foreground notification handler (show alerts while app is open)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

import SplashScreenPage from './screens/screensplash';
import LoginScreen from './screens/login';
import DashboardScreen from './screens/dashboard';
import UpdateProfileScreen from './screens/profile';
import Profile from './screens/profile'; 
import EditProfile from './screens/editprofile'; 
import ForgotPasswordScreen from './screens/forgotpassword';
import ActivitiesScreen from './screens/activities';
import ActivityDetailsScreen from './screens/activitydetails';
import SettingsScreen from './screens/settings';
import ScheduleScreen from './screens/schedules';
import ScheduleDetailScreen from './screens/scheduledetails';

const Stack = createStackNavigator();

export default function App() {

  useEffect(() => {
    const setupPushNotifications = async () => {
      const email = await Storage.getItem('userToken');
      if (!email) return; // skip if not logged in

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('Failed to get push token!');
          return;
        }

        const token = (await Notifications.getExpoPushTokenAsync({ projectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID })).data;
        //console.log('Expo push token:', token);

        // Android channel
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0e2bd17c',
          });
        }

        // Send to backend
        const params = new URLSearchParams();
        params.append('email', email);
        params.append('token', token);

        await fetch(`${API_URL}/save_notification_token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
      }
    };

    setupPushNotifications();
  }, []);

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreenPage} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="Activities" component={ActivitiesScreen} />
          <Stack.Screen name="ActivityDetails" component={ActivityDetailsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Schedules" component={ScheduleScreen} />
          <Stack.Screen name="ScheduleDetails" component={ScheduleDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast config={toastConfig} />
    </>
  );
}
