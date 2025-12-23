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
  ActivityIndicator,
  Platform,
  ScrollView
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { GEOFENCE_TASK } from '../tasks/geofencetask';
import { SCHEDULE_MONITOR_TASK } from '../tasks/schedulemonitortask';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const RADIUS = 50;
const STROKE_WIDTH = 6;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Disclosure content constants
const DISCLOSURE_CONTENT = {
  foreground: {
    title: "Location Access Needed",
    description: "We need access to your location while using the app to:",
    features: [
      "Record your precise check-in location",
      "Verify your attendance location accuracy", 
      "Ensure proper shift timing",
      "Provide accurate work hour tracking"
    ],
    dataUsage: "Your location data is only used for attendance purposes and is encrypted during transmission.",
    nextStep: "You will be prompted to grant \"Allow while using the app\" permission next."
  },
  background: {
    title: "Background Location Access Needed", 
    description: "We need background location access to:",
    features: [
      "Monitor your location during your entire shift",
      "Ensure you remain within your designated work area",
      "Automatically handle check-out if you leave early", 
      "Provide continuous attendance monitoring",
      "Detect geofence entry and exit events"
    ],
    dataUsage: "Location data is encrypted, stored securely, and automatically deleted after shift completion.",
    nextStep: "You will be prompted to grant \"Allow all the time\" permission next."
  }
};

const PRIVACY_POLICY_URL = "https://bcghi.org/privacy-policy/"; // Replace with your actual privacy policy URL

const CheckInProgressButton = ({ email }) => {
  const [checkedIn, setCheckedIn] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [showForegroundDisclosure, setShowForegroundDisclosure] = useState(false);
  const [permissionCallback, setPermissionCallback] = useState(null);
  const [currentDisclosureType, setCurrentDisclosureType] = useState('foreground');
  
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef(null);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    const loadCheckInStatus = async () => {
      try {
        const endTime = await AsyncStorage.getItem('checkin_end');
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

    intervalRef.current = setInterval(() => {
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

  const requestLocationPermissions = async () => {
    try {
      return new Promise((resolve) => {
        setPermissionCallback(() => resolve);
        setCurrentDisclosureType('foreground');
        setShowForegroundDisclosure(true);
      });
    } catch (error) {
      //console.error('Error requesting location permissions:', error);
      Alert.alert('Error', 'An unexpected error occurred while requesting permissions.');
      return false;
    }
  };

  const handlePermissionFlow = async (type) => {
    try {
      if (type === 'foreground') {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

        if (foregroundStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'This feature requires location access while using the app. Please enable it to continue.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          if (permissionCallback) permissionCallback(false);
          return false;
        }

        //console.log('Foreground location permission granted.');

        // Check if we already have background permissions
        const { status: existingBackgroundStatus } = await Location.getBackgroundPermissionsAsync();
        if (existingBackgroundStatus === 'granted') {
          if (permissionCallback) permissionCallback(true);
          return true;
        }

        // Request background permissions
        setCurrentDisclosureType('background');
        setShowDisclosure(true);
        return null; // Continue to background disclosure

      } else if (type === 'background') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

        if (backgroundStatus === 'granted') {
          //console.log('Background location permission granted.');
          if (permissionCallback) permissionCallback(true);
          return true;
        } else {
          Alert.alert(
            'Essential Permission Required',
            'You must enable "Allow all the time" location access for this app to use the complete check-in feature. Some functionality may be limited.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          if (permissionCallback) permissionCallback(false);
          return false;
        }
      }
    } catch (error) {
      //console.error('Error in permission flow:', error);
      if (permissionCallback) permissionCallback(false);
      return false;
    }
  };

  const handleCheckIn = async () => {
    setIsProcessing(true);
    setShowConfirm(false);
    
    try {
      const hasPermission = await requestLocationPermissions();
      if (!hasPermission) {
        setIsProcessing(false);
        return;
      }

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
        throw new Error(data.message || 'Check-in');
      }

      await AsyncStorage.multiSet([
        ['appointmentLat', data.latitude.toString()],
        ['appointmentLng', data.longitude.toString()],
        ['checkin_end', data.work_seconds.toString()],
        ['schedule_id', data.schedule_id.toString()],
      ]);

      setCheckedIn(true);
      setRemainingTime(data.work_seconds);
      animatedProgress.setValue(0);
      startCountdown(data.work_seconds);

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
        text1: 'Checked In Successfully',
        text2: `Shift started at ${new Date().toLocaleTimeString()}`,
      });

      const isRegistered = await TaskManager.isTaskRegisteredAsync(SCHEDULE_MONITOR_TASK);

      if (isRegistered) {
        return; // Avoid duplicate registration
      }

      await BackgroundFetch.registerTaskAsync(SCHEDULE_MONITOR_TASK, {
        minimumInterval: 15 * 60, // 15 minutes (OS minimum)
        stopOnTerminate: false,   // Android
        startOnBoot: true,        // Android
      }); 

    } catch (error) {
      //console.error('Check-in error:', error);
      Toast.show({
        type: 'error',
        text1: 'Check-In',
        text2: error.message || 'Unable to check in at this time',
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
      const response = await fetch(`${apiUrl}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      const data = await response.json();
      
      if (!data.status) {
        throw new Error(data.message || 'Check-out');
      }

      await Location.stopGeofencingAsync(GEOFENCE_TASK);
      await BackgroundFetch.unregisterTaskAsync(SCHEDULE_MONITOR_TASK);
      await AsyncStorage.multiRemove(['checkin_end', 'appointmentLat', 'appointmentLng', 'schedule_id']);

      setCheckedIn(false);
      setRemainingTime(0);
      
      Toast.show({
        type: 'success',
        text1: 'Checked Out Successfully',
        text2: 'Shift completed and recorded',
      });

    } catch (error) {
      //console.error('Check-out error:', error);
      Toast.show({
        type: 'error',
        text1: 'Check-Out',
        text2: error.message || 'Unable to check out at this time',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderDisclosureModal = (isForeground = true) => {
    const content = isForeground ? DISCLOSURE_CONTENT.foreground : DISCLOSURE_CONTENT.background;
    const isVisible = isForeground ? showForegroundDisclosure : showDisclosure;
    const setVisible = isForeground ? setShowForegroundDisclosure : setShowDisclosure;

    return (
      <Modal
        transparent
        visible={isVisible}
        animationType="fade"
        onRequestClose={() => {
          setVisible(false);
          if (permissionCallback) permissionCallback(false);
        }}
      >
        <View style={styles.disclosureOverlay}>
          <View style={styles.disclosureContent}>
            <ScrollView 
              style={styles.disclosureScrollView}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.disclosureTitle}>{content.title}</Text>
              
              <Text style={styles.disclosureDescription}>
                {content.description}
              </Text>

              <View style={styles.featuresList}>
                {content.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Text style={styles.featureBullet}>•</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.dataUsageText}>
                {content.dataUsage}
              </Text>

              <Text style={styles.nextStepText}>
                {content.nextStep}
              </Text>

              <TouchableOpacity 
                style={styles.privacyPolicyLink}
                onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
              >
                <Text style={styles.privacyPolicyText}>
                  View our Privacy Policy
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.disclosureButtons}>
              <TouchableOpacity
                style={[styles.disclosureButton, styles.disclosureCancelButton]}
                onPress={() => {
                  setVisible(false);
                  if (permissionCallback) permissionCallback(false);
                }}
              >
                <Text style={styles.disclosureCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.disclosureButton, styles.disclosureConfirmButton]}
                onPress={async () => {
                  setVisible(false);
                  const result = await handlePermissionFlow(isForeground ? 'foreground' : 'background');
                  
                  // If we're continuing to background disclosure, don't call callback yet
                  if (result !== null && permissionCallback) {
                    permissionCallback(result);
                  }
                }}
              >
                <Text style={styles.disclosureConfirmText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
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
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {checkedIn ? formatTime(remainingTime) : 'Check In'}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Confirmation Modal */}
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
                disabled={isProcessing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={checkedIn ? handleAutoCheckout : handleCheckIn}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" size="small" />
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

      {/* Disclosure Modals */}
      

      {renderDisclosureModal(true)}
      {renderDisclosureModal(false)}
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
    width: 85,
    height: 85,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
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
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#0b184d',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disclosureOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  disclosureContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  disclosureScrollView: {
    flexGrow: 0,
  },
  disclosureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#0b184d',
  },
  disclosureDescription: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureBullet: {
    fontSize: 16,
    marginRight: 8,
    color: '#0b184d',
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    color: '#333',
  },
  dataUsageText: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
    lineHeight: 20,
  },
  nextStepText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
    color: '#0b184d',
    lineHeight: 20,
  },
  privacyPolicyLink: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  privacyPolicyText: {
    color: '#0066cc',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  disclosureButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
  },
  disclosureButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disclosureCancelButton: {
    backgroundColor: '#f1f1f1',
  },
  disclosureCancelText: {
    color: '#333',
    fontWeight: 'bold',
  },
  disclosureConfirmButton: {
    backgroundColor: '#0b184d',
  },
  disclosureConfirmText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CheckInProgressButton;