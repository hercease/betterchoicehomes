import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import * as LocalAuthentication from 'expo-local-authentication';
import Toast from 'react-native-toast-message';
import Storage from '../components/storage';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [storedEmail, setStoredEmail] = useState('');
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const buttonScale = new Animated.Value(1);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  // Check biometric availability and load stored preferences
  useEffect(() => {
    checkBiometricAvailability();
    loadStoredCredentials();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      console.log('Biometric check:', { hasHardware, isEnrolled, supportedTypes });
      
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.error('Biometric check failed:', error);
      setBiometricAvailable(false);
    }
  };

  const loadStoredCredentials = async () => {
    try {
      const enabled = await Storage.getItem('biometricEnabled');
      const email = await Storage.getItem('userEmail');
      
      console.log('Loaded credentials:', { enabled, email });
      
      setBiometricEnabled(enabled === 'true');
      setStoredEmail(email || '');
      
      if (email) {
        setValue('email', email);
      }
    } catch (error) {
      console.error('Failed to load stored credentials:', error);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricAvailable || !storedEmail) {
      Toast.show({
        type: 'info',
        text1: 'Biometric Login Not Available',
        text2: 'Please log in with email and password first',
      });
      return;
    }

    setIsBiometricLoading(true);
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to log in',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Biometric authentication successful - now send email to backend
        Toast.show({
          type: 'success',
          text1: 'Biometric Verified',
          text2: 'Logging you in...',
        });
        
        // Auto-fill the email in the form
        setValue('email', storedEmail);

        console.log('Biometric authentication successful for:', storedEmail);
        
        // Send biometric login request to backend
        await handleBiometricBackendLogin(storedEmail);
        
      } else {
        if (result.error !== 'user_cancel') {
          Toast.show({
            type: 'error',
            text1: 'Authentication Failed',
            text2: 'Please try again or use email/password',
          });
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'Please use email and password',
      });
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const handleBiometricBackendLogin = async (email) => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append('email', email);
      // You might want to add a flag to identify this as biometric login
      //params.append('biometric_login', 'true');

      console.log('Attempting biometric backend login for:', email);

      const response = await fetch(`${apiUrl}/fingerprintlogin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const result = await response.json();
      console.log('Biometric backend login response:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Biometric login failed');
      }

      if (result.status === true) {
        // Save token
        await Storage.setItem('userToken', result.token, 1);
        await Storage.setItem('isActive', result.isActive);
        
        // Update stored email if needed
        if (!storedEmail) {
          await Storage.setItem('userEmail', email);
          setStoredEmail(email);
        }

        // Ensure biometric is enabled
        if (biometricAvailable && !biometricEnabled) {
          await Storage.setItem('biometricEnabled', 'true');
          setBiometricEnabled(true);
        }

        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: 'Welcome back!',
        });

        // Redirect based on isActive
        navigation.replace(result.isActive ? 'Dashboard' : 'EditProfile');
      } else {
        throw new Error(result.message || 'Biometric authentication failed');
      }
    } catch (err) {
      console.error('Biometric backend login error:', err);
      
      // If biometric login fails, fall back to password login
      Alert.alert(
        'Biometric Login Failed',
        err.message || 'Please log in with your password',
        [
          {
            text: 'Use Password',
            onPress: () => {
              setValue('email', storedEmail);
              // Focus on password field if possible
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      
      // Clear stored email if it's invalid
      if (err.message.includes('Invalid credentials') || err.message.includes('User not found')) {
        await Storage.removeItem('userEmail');
        setStoredEmail('');
        setBiometricEnabled(false);
        await Storage.removeItem('biometricEnabled');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoLogin = async (email, password) => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('password', password);

      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      if (result.status === true) {
        // Save token
        await Storage.setItem('userToken', result.token, 1);
        
        // Store email for future biometric logins if not already stored
        if (!storedEmail) {
          await Storage.setItem('userEmail', email);
          setStoredEmail(email);
        }

        // Redirect based on isActive
        navigation.replace(result.isActive ? 'Dashboard' : 'EditProfile');
      } else {
        throw new Error(result.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Auto login error:', err);
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: err.message || 'An error occurred during login',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onSubmit = async (data) => {
    animateButton();
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('email', data.email);
      params.append('password', data.password);

      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      if (result.status === true) {
        // Save token
        await Storage.setItem('userToken', result.token, 1);
        
        // Store email for future biometric logins
        await Storage.setItem('userEmail', data.email);
        setStoredEmail(data.email);

        // Enable biometric by default if available
        if (biometricAvailable && !biometricEnabled) {
          await Storage.setItem('biometricEnabled', 'true');
          setBiometricEnabled(true);
        }

        // Redirect based on isActive
        navigation.replace(result.isActive ? 'Dashboard' : 'EditProfile');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: result.message || 'Invalid credentials',
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: err.message || 'An error occurred during login',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <LinearGradient colors={['#fcb084ff', '#6786eeff']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/better-icon-removebg-preview.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {/* Biometric Login Button */}
          {biometricAvailable && storedEmail && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={isBiometricLoading}
            >
              {isBiometricLoading ? (
                <ActivityIndicator color="#0b184d" size="small" />
              ) : (
                <>
                  <Ionicons name="finger-print" size={24} color="#0b184d" />
                  <Text style={styles.biometricText}>
                    Login with {Platform.OS === 'ios' ? 'Face ID' : 'Fingerprint'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Divider */}
          {(biometricAvailable && storedEmail) && (
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="email"
              rules={{ 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#999"
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              )}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="password"
              rules={{ required: 'Password is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#999"
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  autoCapitalize="none"
                />
              )}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? 'eye-off' : 'eye'} 
                size={24} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotButton}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              activeOpacity={0.9}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>LOG IN</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Biometric Info */}
          {biometricAvailable && !storedEmail && (
            <Text style={styles.biometricInfo}>
              Biometric login will be available after your first successful login
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  eyeIcon: {
    paddingRight: 15,
    padding: 15,
  },
  card: {
    padding: 10,
    marginHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  // Biometric Styles
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0b184d',
    gap: 12,
  },
  biometricText: {
    color: '#0b184d',
    fontSize: 16,
    fontWeight: '600',
  },
  biometricInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  // Divider Styles
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  // Input Styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    borderColor: '#ddd',
    borderRadius: 0,
    fontSize: 16,
    backgroundColor: '#fafafa',
    flex: 1,
    height: 56,
    paddingHorizontal: 20,
    color: '#333'
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#1c37afff',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#053c8dff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    shadowColor: '#5b73dfff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginBottom: 5
  },
});