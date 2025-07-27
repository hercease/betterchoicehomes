import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useAnimatedGestureHandler,
  runOnJS
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/dashboardstyles';

const { width } = Dimensions.get('window');

const DynamicSwipeButton = ({ attendance, setAttendance }) => {
  const translateX = useSharedValue(0);
  const containerWidth = width * 0.9;
  const buttonWidth = 60;

  const isCheckedIn = attendance.isCheckedIn;
  const buttonText = isCheckedIn ? "Swipe to Check Out" : "Swipe to Check In";
  const buttonColor = isCheckedIn ? "#2979FF" : "#f58634";

  const handleSwipeSuccess = () => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAttendance(prev => ({
      isCheckedIn: !prev.isCheckedIn,
      checkInTime: !prev.isCheckedIn ? now : prev.checkInTime,
      checkOutTime: prev.isCheckedIn ? now : prev.checkOutTime
    }));
  };

  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      if (event.translationX > 0) {
        translateX.value = Math.min(
          event.translationX,
          containerWidth - buttonWidth
        );
      }
    },
    onEnd: (event) => {
      if (event.translationX > containerWidth * 0.7) {
        translateX.value = withSpring(0, { damping: 10 });
        runOnJS(handleSwipeSuccess)();
      } else {
        translateX.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.swipeBackground}>
        <Text style={styles.swipeBackgroundText}>{buttonText}</Text>
      </View>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[
          styles.swipeButton,
          { backgroundColor: buttonColor },
          animatedStyle
        ]}>
          <Ionicons 
            name={isCheckedIn ? "log-out-outline" : "log-in-outline"} 
            size={24} 
            color="#fff" 
          />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

export default DynamicSwipeButton;