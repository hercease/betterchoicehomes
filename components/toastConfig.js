import { BaseToast, ErrorToast } from 'react-native-toast-message';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const toastConfig = {
  /*
   * Success Toast
   */
  success: ({ text1, text2, ...rest }) => (
    <View style={styles.successContainer}>
      <LinearGradient
        colors={['#4ADE80', '#22C55E']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={24} color="white" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.successText1}>{text1}</Text>
          {text2 && <Text style={styles.successText2}>{text2}</Text>}
        </View>
      </LinearGradient>
    </View>
  ),

  /*
   * Error Toast
   */
  error: ({ text1, text2, ...rest }) => (
    <View style={styles.errorContainer}>
      <LinearGradient
        colors={['#F87171', '#EF4444']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle" size={24} color="white" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.errorText1}>{text1}</Text>
          {text2 && <Text style={styles.errorText2}>{text2}</Text>}
        </View>
      </LinearGradient>
    </View>
  ),

  /*
   * Info Toast (Bonus)
   */
  info: ({ text1, text2, ...rest }) => (
    <View style={styles.infoContainer}>
      <LinearGradient
        colors={['#60A5FA', '#3B82F6']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="information-circle" size={24} color="white" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.infoText1}>{text1}</Text>
          {text2 && <Text style={styles.infoText2}>{text2}</Text>}
        </View>
      </LinearGradient>
    </View>
  )
};

const styles = StyleSheet.create({
  // Base Styles
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    width: '90%',
    marginHorizontal: '5%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },

  // Success Variant
  successContainer: {
    marginTop: 40, // Position below status bar
  },
  successText1: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  successText2: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },

  // Error Variant
  errorContainer: {
    marginTop: 40,
  },
  errorText1: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  errorText2: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },

  // Info Variant
  infoContainer: {
    marginTop: 40,
  },
  infoText1: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoText2: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
});

export default toastConfig;
