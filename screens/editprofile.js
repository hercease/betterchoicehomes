import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditProfile = ({ navigation }) => {
  const [formData, setFormData] = useState({
    // Personal Details
    address: '',
    sin: '',
    emergencyContact: '',
    // Bank Information
    transitNumber: '',
    institutionNumber: '',
    accountNumber: '',
    // Medical Information
    tuberculosis: false,
    covidVaccine1: false,
    covidVaccine2: false,
    covidVaccineOptional: false,
    firstAidCPR: false
  });

  const [errors, setErrors] = useState({});

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const savedData = await AsyncStorage.getItem('userProfile');
        if (savedData) {
          setFormData(JSON.parse(savedData));
        }
      } catch (error) {
        console.error('Failed to load profile', error);
        Alert.alert('Error', 'Failed to load profile data');
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    // Validate required fields
    const newErrors = {};
    if (!formData.address.trim()) newErrors.address = 'Required';
    if (!formData.sin.trim()) newErrors.sin = 'Required';
    if (!formData.emergencyContact.trim()) newErrors.emergencyContact = 'Required';
    if (!formData.transitNumber.trim()) newErrors.transitNumber = 'Required';
    if (!formData.institutionNumber.trim()) newErrors.institutionNumber = 'Required';
    if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Required';
    if (!formData.firstAidCPR) newErrors.firstAidCPR = 'First Aid & CPR certification is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(formData));
      navigation.navigate('DocumentUpload'); // Changed from navigation.goBack()
    } catch (error) {
      console.error('Failed to save profile', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const toggleSwitch = (field) => {
    handleChange(field, !formData[field]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0b184d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Personal Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        
        <InputField
          label="Address *"
          value={formData.address}
          onChangeText={(text) => handleChange('address', text)}
          error={errors.address}
        />
        
        <InputField
          label="SIN (Social Insurance Number) *"
          value={formData.sin}
          onChangeText={(text) => handleChange('sin', text)}
          error={errors.sin}
          keyboardType="numeric"
        />
        
        <InputField
          label="Emergency Contact Number *"
          value={formData.emergencyContact}
          onChangeText={(text) => handleChange('emergencyContact', text)}
          error={errors.emergencyContact}
          keyboardType="phone-pad"
        />
      </View>

      {/* Bank Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bank Information</Text>
        
        <InputField
          label="Transit Number *"
          value={formData.transitNumber}
          onChangeText={(text) => handleChange('transitNumber', text)}
          error={errors.transitNumber}
          keyboardType="numeric"
        />
        
        <InputField
          label="Institution Number *"
          value={formData.institutionNumber}
          onChangeText={(text) => handleChange('institutionNumber', text)}
          error={errors.institutionNumber}
          keyboardType="numeric"
        />
        
        <InputField
          label="Account Number *"
          value={formData.accountNumber}
          onChangeText={(text) => handleChange('accountNumber', text)}
          error={errors.accountNumber}
          keyboardType="numeric"
        />
      </View>

      {/* Medical Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Information</Text>
        
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Tuberculosis Test Completed *</Text>
          <Switch
            value={formData.tuberculosis}
            onValueChange={() => toggleSwitch('tuberculosis')}
            thumbColor={formData.tuberculosis ? '#f58634' : '#f5f5f5'}
            trackColor={{ false: '#767577', true: '#f58634' }}
          />
        </View>
        
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>COVID Vaccine (Dose 1) *</Text>
          <Switch
            value={formData.covidVaccine1}
            onValueChange={() => toggleSwitch('covidVaccine1')}
            thumbColor={formData.covidVaccine1 ? '#f58634' : '#f5f5f5'}
            trackColor={{ false: '#767577', true: '#f58634' }}
          />
        </View>
        
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>COVID Vaccine (Dose 2) *</Text>
          <Switch
            value={formData.covidVaccine2}
            onValueChange={() => toggleSwitch('covidVaccine2')}
            thumbColor={formData.covidVaccine2 ? '#f58634' : '#f5f5f5'}
            trackColor={{ false: '#767577', true: '#f58634' }}
          />
        </View>
        
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>COVID Vaccine (Optional Booster)</Text>
          <Switch
            value={formData.covidVaccineOptional}
            onValueChange={() => toggleSwitch('covidVaccineOptional')}
            thumbColor={formData.covidVaccineOptional ? '#f58634' : '#f5f5f5'}
            trackColor={{ false: '#767577', true: '#f58634' }}
          />
        </View>
        
        <View style={[styles.switchContainer, errors.firstAidCPR && styles.errorSwitchContainer]}>
          <Text style={styles.switchLabel}>First Aid & CPR Certified *</Text>
          <Switch
            value={formData.firstAidCPR}
            onValueChange={() => toggleSwitch('firstAidCPR')}
            thumbColor={formData.firstAidCPR ? '#f58634' : '#f5f5f5'}
            trackColor={{ false: '#767577', true: '#f58634' }}
          />
        </View>
        {errors.firstAidCPR && <Text style={styles.errorText}>{errors.firstAidCPR}</Text>}
      </View>

      {/* Save Button */}
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSave}
        activeOpacity={0.8}
      >
        <Text style={styles.saveButtonText}>Save Changes</Text>
        <Ionicons name="checkmark" size={20} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
};

// Reusable Input Component
const InputField = ({ label, error, ...props }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, error && styles.errorInput]}
      {...props}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0b184d',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    margin: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0b184d',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  errorInput: {
    borderColor: '#f44336',
    backgroundColor: '#fffafa',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  errorSwitchContainer: {
    borderBottomColor: '#f44336',
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 5,
  },
  saveButton: {
    backgroundColor: '#f58634',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    margin: 20,
    marginTop: 10,
    shadowColor: '#f58634',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
});

export default EditProfile;