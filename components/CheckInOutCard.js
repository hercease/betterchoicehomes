import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RADIUS = 50;
const STROKE_WIDTH = 6;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const COUNTDOWN_SECONDS = 3600; // 1 hour or from backend

const CheckInProgressButton = () => {
  const [checkedIn, setCheckedIn] = useState(false);
  const [remainingTime, setRemainingTime] = useState(COUNTDOWN_SECONDS);
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef(null);

  useEffect(() => {
    if (checkedIn) {
      startCountdown();
    }

    return () => clearInterval(intervalRef.current);
  }, [checkedIn]);

  const startCountdown = () => {
    const endTime = Date.now() + remainingTime * 1000;
    AsyncStorage.setItem('checkin_end', endTime.toString());

    intervalRef.current = setInterval(() => {
      const secondsLeft = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setRemainingTime(secondsLeft);

      const progress = 1 - secondsLeft / COUNTDOWN_SECONDS;
      animatedProgress.setValue(progress);

      if (secondsLeft <= 0) {
        clearInterval(intervalRef.current);
        handleAutoCheckout();
      }
    }, 1000);
  };

  const handleAutoCheckout = async () => {
    setCheckedIn(false);
    await AsyncStorage.removeItem('checkin_end');
    Alert.alert('Checked Out', 'You have been automatically checked out.');
  };

  const confirmCheck = () => {
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
              setCheckedIn(true);
              setRemainingTime(COUNTDOWN_SECONDS);
              animatedProgress.setValue(0);
            }
          },
        },
      ]
    );
  };

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
      <TouchableOpacity onPress={confirmCheck} activeOpacity={0.8}>
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
});

export default CheckInProgressButton;
