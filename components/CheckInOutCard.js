import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Animated,
  Linking,
  ActivityIndicator
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
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef(null);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Check existing check-in status on mount
  useEffect(() => {
    const loadCheckInStatus = async () => {
      try {
        const endTime = await AsyncStorage.getItem('checkin_end' || 0);
        if (endTime) {
          const secondsLeft = Math.max(0, Math.floor((parseInt(endTime) - Date.now()) / 1000));
          if (secondsLeft > 0) {
            setCheckedIn(true);
            setRemainingTime(secondsLeft);
            startCountdown(secondsLeft);
          } else {
            await handleAutoCheckout();
          }
        }
      } catch (error) {
        console.error('Failed to load check-in status', error);
      }
    };

    loadCheckInStatus();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

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
        await handleAutoCheckout();
      }
    }, 1000);
  };

  const requestLocationPermissions = async () => {
    setIsProcessing(true);
    try {
      // Foreground permission
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        throw new Error('Location permission required');
      }

      // Background permission
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        throw new Error('Background location permission required');
      }

      return true;
    } catch (error) {
      Alert.alert(
        'Permission Needed',
        error.message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    } finally {
      setIsProcessing(false);
    }
  };


  const handleCheckIn = async () => {
    setIsProcessing(true);
    setShowConfirm(false);
    
    try {
      const hasPermission = await requestLocationPermissions();
      if (!hasPermission) return;

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });
      
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('latitude', currentLocation.coords.latitude);
      params.append('longitude', currentLocation.coords.longitude);
      params.append('action', 'clockin');
      params.append('timezone', timezone);
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      const data = await response.json();

      if (!data.status) {
        throw new Error(data.message || 'Check-in failed');
      }

      // Save appointment location and start countdown
      await AsyncStorage.multiSet([
        ['appointmentLat', data.latitude.toString()],
        ['appointmentLng', data.longitude.toString()],
      ]);

      setCheckedIn(true);
      setRemainingTime(data.work_seconds);
      animatedProgress.setValue(0);
      startCountdown(data.work_seconds);

      // Start geofencing
      await Location.startGeofencingAsync(GEOFENCE_TASK, [{
        identifier: `appointment_${data.appointmentId || 'default'}`,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        radius: 10,
        notifyOnEnter: true,
        notifyOnExit: true,
      }]);

      Toast.show({
        type: 'success',
        text1: 'Checked In',
        text2: `Shift started at ${new Date().toLocaleTimeString()}`,
      });

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Check-In Failed',
        text2: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoCheckout = async () => {
    setIsProcessing(true);
    try {
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('action', 'clockout');
      params.append('timezone', timezone);
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      await fetch(`${apiUrl}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      setRemainingTime(0);
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
      await AsyncStorage.multiRemove(['checkin_end', 'appointmentLat', 'appointmentLng']);

      setCheckedIn(false);
      Toast.show({
        type: 'success',
        text1: 'Checked Out',
        text2: 'Shift completed successfully',
      });

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Check-Out Failed',
        text2: error.message || 'Failed to check out',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CIRCLE_CIRCUMFERENCE],
  });

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={() => setShowConfirm(true)}
        activeOpacity={0.7}
        disabled={isProcessing}
      >
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
              stroke={checkedIn ? "#4CAF50" : "#0b184d"}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${CIRCLE_CIRCUMFERENCE}, ${CIRCLE_CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              rotation="-90"
              origin="60, 60"
            />
          </Svg>
          <View style={[
            styles.centerContent,
            { backgroundColor: checkedIn ? "#4CAF50" : "#f58634" }
          ]}>
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {checkedIn ? formatTime(remainingTime) : 'Check In'}
              </Text>
            )}
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
            <Text style={styles.modalTitle}>
              {checkedIn ? 'Confirm Checkout' : 'Confirm Check-in'}
            </Text>
            <Text style={styles.modalMessage}>
              {checkedIn 
                ? 'Are you sure you want to end your shift?' 
                : 'Ready to start your shift?'}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={checkedIn ? handleAutoCheckout : handleCheckIn}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {checkedIn ? 'Check Out' : 'Check In'}
                  </Text>
                )}
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
  cancelButton: {
    backgroundColor: '#f1f1f1',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#333',
  },
  confirmButton: {
    backgroundColor: '#0b184d',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CheckInProgressButton;
