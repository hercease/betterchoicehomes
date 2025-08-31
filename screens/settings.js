// SettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import Storage from '../components/storage';
import Toast from 'react-native-toast-message';

export default function SettingsScreen({ navigation }) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
 
  const [loading, setLoading] = useState(false);

  const newPasswordValue = watch('newPassword'); // to validate confirm password
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const authToken = await Storage.getItem('userToken');
      if (!authToken) {
        navigation.replace('Login');
        return;
      }
      const params = new URLSearchParams();
      params.append('email', authToken);
      params.append('newPassword', data.newPassword);
      params.append('currentPassword', data.currentPassword);
      params.append('confirmPassword', data.confirmPassword);
      params.append('timezone', timezone);
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/changepassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!response.ok) throw new Error('Failed to change password');

      const resp = await response.json();
      Toast.show({
        type: resp.status ? 'success' : 'error',
        text1: resp.status ? 'Success' : 'Error',
        text2: resp.message,
        visibilityTime: 5000,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Something went wrong',
        visibilityTime: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Change Password Card */}
      <View style={styles.card}>
        {/* Icon */}
        <View style={[styles.iconWrapper, { backgroundColor: '#0b184d20' }]}>
          <MaterialIcons name="lock" size={28} color="#0b184d" />
        </View>

        <Text style={styles.cardTitle}>Change Password</Text>
        <Text style={styles.cardSubtitle}>
          Update your password regularly to keep your account secure.
        </Text>

        {/* Current Password */}
        <Controller
          control={control}
          name="currentPassword"
          rules={{ required: 'Current password is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[
                styles.input,
                errors.currentPassword && styles.errorInput,
              ]}
              placeholder="Current Password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.currentPassword && (
          <Text style={styles.errorText}>{errors.currentPassword.message}</Text>
        )}

        {/* New Password */}
        <Controller
          control={control}
          name="newPassword"
          rules={{
            required: 'New password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters',
            },
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, errors.newPassword && styles.errorInput]}
              placeholder="New Password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.newPassword && (
          <Text style={styles.errorText}>{errors.newPassword.message}</Text>
        )}

        {/* Confirm Password */}
        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: 'Please confirm your new password',
            validate: (value) =>
              value === newPasswordValue || 'Passwords do not match',
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[
                styles.input,
                errors.confirmPassword && styles.errorInput,
              ]}
              placeholder="Confirm New Password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
        )}

        {/* Save Button */}
         <TouchableOpacity style={styles.saveButton} onPress={handleSubmit(onSubmit)} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0b184d',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0b184d',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f5f6fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    fontSize: 14,
    color: '#333',
  },
  errorInput: {
    borderWidth: 1,
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#0b184d',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
