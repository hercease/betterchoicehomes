import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  Switch,
  Modal
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import Storage from '../components/storage';
import Toast from 'react-native-toast-message';
import * as LocalAuthentication from 'expo-local-authentication';

// Memoized Password Input Component - This prevents re-renders that cause focus loss
const PasswordInput = React.memo(({ 
  name, 
  placeholder, 
  control, 
  errors, 
  showPassword, 
  onToggleVisibility,
  newPasswordValue 
}) => {
  // Memoize rules to prevent recreation on every render
  const rules = useMemo(() => {
    const baseRules = { required: `${placeholder} is required` };
    
    switch (name) {
      case 'newPassword':
        return {
          ...baseRules,
          minLength: {
            value: 6,
            message: 'Password must be at least 6 characters',
          }
        };
      case 'confirmPassword':
        return {
          ...baseRules,
          validate: (value) => value === newPasswordValue || 'Passwords do not match'
        };
      default:
        return baseRules;
    }
  }, [name, placeholder, newPasswordValue]);

  return (
    <View>
      <View style={styles.inputContainer}>
        <Controller
          control={control}
          name={name}
          rules={rules}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[
                styles.input,
                errors[name] && styles.errorInput,
              ]}
              placeholder={placeholder}
              placeholderTextColor="#999"
              secureTextEntry={!showPassword[name]}
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
            />
          )}
        />
        <TouchableOpacity
          style={styles.visibilityToggle}
          onPress={() => onToggleVisibility(name)}
        >
          <Ionicons
            name={showPassword[name] ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      </View>
      {errors[name] && (
        <Text style={styles.errorText}>{errors[name].message}</Text>
      )}
    </View>
  );
});

export default function SettingsScreen({ navigation }) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [showResetModal, setShowResetModal] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Watch the new password value for confirm password validation
  const newPasswordValue = watch('newPassword');
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

   // Check biometric availability
  useEffect(() => {
    checkBiometricAvailability();
    loadBiometricPreference();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.error('Biometric check failed:', error);
    }
  };

  const loadBiometricPreference = async () => {
    try {
      const enabled = await Storage.getItem('biometricEnabled');
      setBiometricEnabled(enabled === 'true');
    } catch (error) {
      console.error('Failed to load biometric preference:', error);
    }
  };

  const toggleBiometric = async (value) => {
    if (value) {
      // Enable biometric
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to enable biometric login',
          fallbackLabel: 'Use Passcode',
        });

        if (result.success) {
          setBiometricEnabled(true);
          await Storage.setItem('biometricEnabled', 'true');
          Toast.show({
            type: 'success',
            text1: 'Biometric Enabled',
            text2: 'You can now use biometric authentication',
          });
        }
      } catch (error) {
        console.error('Biometric authentication failed:', error);
        Toast.show({
          type: 'error',
          text1: 'Authentication Failed',
          text2: 'Could not enable biometric authentication',
        });
      }
    } else {
      // Disable biometric
      setBiometricEnabled(false);
      await Storage.setItem('biometricEnabled', 'false');
      Toast.show({
        type: 'info',
        text1: 'Biometric Disabled',
        text2: 'Biometric authentication has been turned off',
      });
    }
  };

  // Stable toggle function - won't recreate on every render
  const togglePasswordVisibility = useCallback((field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  }, []);

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
      
      if (resp.status) {
        Toast.show({
          type: 'success',
          text1: 'Password Changed',
          text2: 'Your password has been updated successfully',
          visibilityTime: 4000,
        });
        reset();
      } else {
        throw new Error(resp.message || 'Failed to change password');
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Something went wrong. Please try again.',
        visibilityTime: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    reset();
    setShowResetModal(false);
    Toast.show({
      type: 'info',
      text1: 'Form Reset',
      text2: 'All changes have been discarded',
    });
  };

  const handleBackPress = () => {
    if (isDirty) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

            
          {/* Biometric Authentication */}
          {biometricAvailable && (
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="finger-print" size={22} color="#0b184d" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Biometric Authentication</Text>
                  <Text style={styles.settingDescription}>
                    Use fingerprint or face ID to log in
                  </Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometric}
                trackColor={{ false: '#f1f1f1', true: '#0b184d40' }}
                thumbColor={biometricEnabled ? '#0b184d' : '#f4f3f4'}
              />
            </View>
          )}
          
          {/* Change Password Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: '#0b184d20' }]}>
                <MaterialIcons name="lock" size={24} color="#0b184d" />
              </View>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>Change Password</Text>
                <Text style={styles.cardSubtitle}>
                  Update your password regularly to keep your account secure
                </Text>
              </View>
            </View>

            <View style={styles.form}>
              <PasswordInput
                name="currentPassword"
                placeholder="Current Password"
                control={control}
                errors={errors}
                showPassword={showPassword}
                onToggleVisibility={togglePasswordVisibility}
                newPasswordValue={newPasswordValue}
              />

              <PasswordInput
                name="newPassword"
                placeholder="New Password"
                control={control}
                errors={errors}
                showPassword={showPassword}
                onToggleVisibility={togglePasswordVisibility}
                newPasswordValue={newPasswordValue}
              />

              <PasswordInput
                name="confirmPassword"
                placeholder="Confirm New Password"
                control={control}
                errors={errors}
                showPassword={showPassword}
                onToggleVisibility={togglePasswordVisibility}
                newPasswordValue={newPasswordValue}
              />

              <View style={styles.buttonGroup}>
                {isDirty && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => setShowResetModal(true)}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    styles.saveButton,
                    (!isDirty || loading) && styles.disabledButton
                  ]} 
                  onPress={handleSubmit(onSubmit)} 
                  disabled={!isDirty || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="help-circle-outline" size={22} color="#0b184d" />
              <Text style={styles.settingTitle}>Help & Support</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#0b184d" />
              <Text style={styles.settingTitle}>Privacy Policy</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="document-text-outline" size={22} color="#0b184d" />
              <Text style={styles.settingTitle}>Terms of Service</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#999" />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>January 2024</Text>
          </View>
        </View>
      </ScrollView>

      {/* Reset Confirmation Modal */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Discard Changes?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to discard all changes? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowResetModal(false)}
              >
                <Text style={styles.modalCancelText}>Keep Editing</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleResetForm}
              >
                <Text style={styles.modalConfirmText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0b184d',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0b184d',
    marginBottom: 12,
    marginLeft: 4,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b184d',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    paddingRight: 50,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  errorInput: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  visibilityToggle: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#0b184d',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0b184d',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  modalConfirmButton: {
    backgroundColor: '#dc3545',
  },
  modalCancelText: {
    color: '#333',
    fontWeight: '600',
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '600',
  },
});