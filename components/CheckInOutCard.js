import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { GEOFENCE_TASK } from '../tasks/geofencetask';

const RADIUS = 50;
const STROKE_WIDTH = 6;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const CheckInProgressButton = ({ email }) => {

  const [checkedIn, setCheckedIn] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // On mount, restore countdown from AsyncStorage
 

  const startCountdown = (seconds) => {
    const endTime = Date.now() + seconds * 1000;
    AsyncStorage.setItem('checkin_end', endTime.toString());

    intervalRef.current = setInterval(async () => {
      const secondsLeft = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setRemainingTime(secondsLeft);

      const progress = 1 - secondsLeft / seconds;
      animatedProgress.setValue(progress);

      if (secondsLeft <= 0) {
        clearInterval(intervalRef.current);
        handleAutoCheckout();
      }
    }, 1000);
  };

 // Request location permissions helper
async function requestLocationPermissions() {
  // Foreground permission
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

  if (foregroundStatus !== 'granted') {
    Alert.alert(
      'Permission Needed',
      'Location permission is required to check in.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    );
    return false;
  }

  // Background permission (needed for geofencing)
  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

  if (backgroundStatus !== 'granted') {
    Alert.alert(
      'Permission Needed',
      'Background location permission is required for geofencing.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    );
    return false;
  }

  return true;
}

// Your main check-in function
const handleCheckIn = async () => {
  try {

    //setShowConfirm(false);

    // Ask for permissions first
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) return;

    // Get current location
    const currentLocation = await Location.getCurrentPositionAsync({});
    const coords = {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    };

    // Send to backend
    const params = new URLSearchParams();
    params.append('email', email);
    params.append('latitude', coords.latitude);
    params.append('longitude', coords.longitude);
    params.append('action', 'clockin');
    params.append('timezone', timezone);

    const res = await fetch(`${API_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await res.json();

    if (!data.status) {
      Toast.show({
        type: 'error',
        text1: 'Check-In Failed',
        text2: data.message || 'You are not at the appointment location.',
      });
      return;
    }

    // Save appointment coordinates for geofencing
    const appointmentLat = parseFloat(data.latitude);
    const appointmentLng = parseFloat(data.longitude);

    await AsyncStorage.setItem('appointmentLat', appointmentLat.toString());
    await AsyncStorage.setItem('appointmentLng', appointmentLng.toString());

    //console.log(`Saved appointment coords: ${appointmentLat}, ${appointmentLng}`);

    // Set countdown
    const countdownSeconds = data.work_seconds;
    setCheckedIn(true);
    setRemainingTime(countdownSeconds);
    animatedProgress.setValue(0);
    startCountdown(countdownSeconds);

    // Start geofencing
    await Location.startGeofencingAsync(GEOFENCE_TASK, [
      {
        identifier: `appointment_${data.appointmentId || 'default'}`,
        latitude: appointmentLat,
        longitude: appointmentLng,
        radius: 10,
        notifyOnEnter: true,
        notifyOnExit: true,
      },
    ]);

  } catch (err) {
    console.error(err);
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: err.message || 'Could not check in.',
    });
  }
};

  const handleAutoCheckout = async () => {
    try {
        //setShowConfirm(false);
        // Send to backend
        const params = new URLSearchParams();
        params.append('email', email);
        params.append('action', 'clockout');
        params.append('timezone', timezone);

        await fetch(`${API_URL}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: params.toString(),
        });
      
    } catch (err) {
      console.error(err);
    }

    setCheckedIn(false);
    await AsyncStorage.multiRemove(['checkin_end', 'appointmentLat', 'appointmentLng']);
    //Alert.alert('Checked Out', 'You have been automatically checked out.');
    Toast.show({
      type: 'success',
      text1: 'Checked Out',
      text2: err.message || 'Could not check out.',
    });
  };


 /* const confirmCheck = () => {
    Alert.alert(
      checkedIn ? 'Confirm Checkout' : 'Confirm Check-in',
      `Are you sure you want to ${checkedIn ? 'checkout' : 'check in'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            if (checkedIn) {
              handleAutoCheckout();
            } else {
              handleCheckIn();
            }
          },
        },
      ]
    );
  }; */

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CIRCLE_CIRCUMFERENCE],
  });

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setShowConfirm(true)} activeOpacity={0.8}>
        <View style={styles.buttonContainer}>
          <Svg height="120" width="120">
            <Circle
              cx="60"
              cy="60"
              r={RADIUS}
              stroke="#e6e6e6"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <AnimatedCircle
              cx="60"
              cy="60"
              r={RADIUS}
              stroke="#0b184d"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${CIRCLE_CIRCUMFERENCE}, ${CIRCLE_CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              rotation="-90"
              origin="60, 60"
            />
          </Svg>
          <View style={styles.centerContent}>
            <Text style={styles.buttonText}>
              {checkedIn ? formatTime(remainingTime) : 'Check In'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

       <Modal
      transparent
      visible={showConfirm}
      animationType="fade"
      onRequestClose={() => setShowConfirm(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{checkedIn ? 'Confirm Checkout' : 'Confirm Check-in'}</Text>
          <Text style={styles.modalMessage}>
              Are you sure you want to {checkedIn === 'checkout' ? 'checkout' : 'check in'}?
          </Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#ccc' }]}
              onPress={() => { setShowConfirm(false) }}
            >
              <Text>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => {
                if (checkedIn) {
                    handleAutoCheckout();
                  } else {
                    handleCheckIn();
                  }
              }}
            >
              <Text style={{ color: '#fff' }}>Yes, Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    </View>

    
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    width: 87,
    height: 87,
    borderRadius: 42.5,
    backgroundColor: '#f58634',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
});

export default CheckInProgressButton;
