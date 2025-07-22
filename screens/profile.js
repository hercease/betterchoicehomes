import { View, Text, StyleSheet } from 'react-native';

export default function ProfileUpdateScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Please update your profile.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    color: 'red',
  },
});