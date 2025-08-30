import React, { useState } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import Storage from '../components/storage';
import { API_URL, APP_NAME } from '@env';


const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const buttonScale = new Animated.Value(1);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  console.log('API URL:', apiUrl);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

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
    animateButton(); // optional animation
    setIsLoading(true);

    try {
      // For x-www-form-urlencoded (no FormData needed)
      const params = new URLSearchParams();
      params.append('email', data.email);
      params.append('password', data.password);
  
      // Send request
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(), // URLSearchParams handles encoding
      });

      const result = await response.json();
      console.log(response);

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      

      if (result.status === true) {
        // Save token & email
        await Storage.setItem('userToken', result.token, 1);

        // Redirect based on isActive
        navigation.replace(result.isActive ? 'Dashboard' : 'UpdateProfile');
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
        text2: err.message + ' hello' || 'An error occurred during login',
      });
    } finally {
      setIsLoading(false);
    }
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

          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="email"
              rules={{ required: 'Email is required' }}
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
                />
              )}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

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
                />
              )}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#666" />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotButton}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit(onSubmit)}
              activeOpacity={0.9}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>LOG IN</Text>}
            </TouchableOpacity>
          </Animated.View>
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
