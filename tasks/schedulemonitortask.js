
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { GEOFENCE_TASK } from '../tasks/geofencetask';


export const SCHEDULE_MONITOR_TASK = 'SCHEDULE_MONITOR_TASK';

TaskManager.defineTask(SCHEDULE_MONITOR_TASK, async () => {
  try {
    const email = await AsyncStorage.getItem('userToken');
    const scheduleId = await AsyncStorage.getItem('schedule_id');

    if (!email || !scheduleId) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    const params = new URLSearchParams();
    params.append('email', email);
    params.append('schedule_id', scheduleId);

    const res = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/checkscheduleclockout`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      }
    );

    if (!res.ok) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const { clocked_out, clocked_out_at } = await res.json();

    if (!clocked_out) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    await BackgroundFetch.unregisterTaskAsync(SCHEDULE_MONITOR_TASK);
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
    await AsyncStorage.multiRemove(['checkin_end', 'appointmentLat', 'appointmentLng', 'schedule_id']);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Shift Ended',
        body: `You were checked out at ${clocked_out_at}.`,
      },
      trigger: null,
    });

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.error('Schedule monitor failed:', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});
