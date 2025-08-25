import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Storage from '../components/storage';
import { API_URL, APP_NAME } from '@env';

export const GEOFENCE_TASK = 'GEOFENCE_TASK';

TaskManager.defineTask(GEOFENCE_TASK, async ({ data: { eventType, region }, error }) => {
  if (error) {
    console.error("Geofence Task Error:", error);
    return;
  }
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let message = '';
  if (eventType === Location.GeofencingEventType.Enter) {
    message = "You have entered the appointment area, don't forget to log in";
  } else if (eventType === Location.GeofencingEventType.Exit) {

    message = "You're leaving your appointment location,If you move too far, you will be clocked out automatically.";

    // Fetch saved email
    const email = await Storage.getItem('userToken');
      if (!email) return;

    // Clock-out request
    const params = new URLSearchParams();
    params.append('email', email);
    params.append('action', 'clockout');
    params.append('timezone', timezone);

    try {
        const res = await fetch(`${API_URL}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
      const data = await res.json();
      console.log("Clock-out result:", data);

      if (data.success) {

        await Location.stopGeofencingAsync(GEOFENCE_TASK);
        await AsyncStorage.multiRemove(['checkin_end', 'appointmentLat', 'appointmentLng']);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Clocked Out",
            body: "You have been clocked out automatically because you left the location.",
          },
          trigger: null,
        });
        
      }
    } catch (err) {
      console.error("Clock-out request failed:", err);
    }
  }

    if (message) {

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Alert',
          body: message,
        },
        trigger: null, // Send immediately
      });
      
    }


});
