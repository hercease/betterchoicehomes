import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function ForgotPasswordScreen({ navigation }) {
  const { control, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const buttonScale = new Animated.Value(1);

  const onSubmit = async (data) => {
      animateButton(); // optional animation
      setIsLoading(true);
  
      try {
        // For x-www-form-urlencoded (no FormData needed)
        const params = new URLSearchParams();
        params.append('email', data.email);
  
        // Send request
        const response = await fetch('http://192.168.46.108/betterchoicehomesapi/forgot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(), // URLSearchParams handles encoding
        });
  
        const result = await response.json();
  
        if (!response.ok) {
          throw new Error(result.message || 'Login failed');
        }
  
        if (result.status === true) {
          // Save token & email
          Toast.show({
            type: 'success',
            text1: 'Successful',
            text2: result.message || 'Invalid credentials',
          });

            setTimeout(() => {
              navigation.navigate('Login');
            }, 4000);

        } else {

          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: result.message || 'Invalid credentials',
          });

        }
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: err.message || 'An error occurred',
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
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter your email to reset your password</Text>

          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email address',
                },
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
          </View>
          {errors.email && (
            <Text style={styles.errorText}>{errors.email.message}</Text>
          )}

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit(onSubmit)}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back to Login</Text>
          </TouchableOpacity>
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
    flex: 1,
    height: 56,
    paddingHorizontal: 20,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#053c8dff',
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  errorText: {
    color: '#c0392b',
    marginBottom: 10,
    marginLeft: 5,
    fontSize: 13,
  },
  backButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  backText: {
    color: '#1c37afff',
    fontSize: 14,
  },
});
