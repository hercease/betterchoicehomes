import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import toastConfig from './components/toastConfig';


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
import { use } from 'react';

const Stack = createStackNavigator();


export default function App() {
  
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
        </Stack.Navigator>
      </NavigationContainer>
       <Toast config={toastConfig} />

    </>
  );
}