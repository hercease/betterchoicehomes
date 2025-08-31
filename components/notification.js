// utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Storage from 'storage';
import { API_URL } from '@env';

export async function registerForPushNotificationsAsync() {
  try {
    const email = await Storage.getItem('userToken');
    if (!email) return null;

    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for notifications!');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);

    // Send to backend along with email
    const params = new URLSearchParams();
    params.append('email', email);
    params.append('token', token);
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    await fetch(`${apiUrl}/save_notification_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    return token;
  } catch (err) {
    console.error('Error registering for notifications:', err);
    return null;
  }
}
