import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, RefreshControl, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller, useController  } from 'react-hook-form';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

const EditProfile = ({ navigation }) => {
  const [showLicenseDatePicker, setShowLicenseDatePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
  const { control, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    defaultValues: {
      address: '',
      sin: '',
      emergencyContact: '',
      transitNumber: '',
      institutionNumber: '',
      accountNumber: '',
      tuberculosisDoc: null,
      covidVaccine1Doc: null,
      covidVaccine2Doc: null,
      covidVaccineOptionalDoc: null,
      firstAidCPRDoc: null,
      dateOfBirth: { 
        required: 'Date of birth is required',
        validate: value => {
          if (value) {
            const dob = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - dob.getFullYear();
            return age >= 18 || 'Must be at least 18 years old';
          }
          return true;
        }
      }
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    reset();
    setTimeout(() => setRefreshing(false), 1000); // simulate refresh
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(data));
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save profile', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const DocumentUploadField = ({ name, label, required, control, errors }) => {
    const { field } = useController({
      control,
      name,
      rules: required ? { required: `${label} is required` } : {},
    });

    const pickDocument = async () => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/pdf',
          copyToCacheDirectory: true,
          multiple: false,
        });

        if (!result.canceled) {
          const file = result.assets[0]; // <- actual file info

          const fileContent = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const document = {
            name: file.name,
            type: file.mimeType,
            size: file.size,
            uri: file.uri,
            base64: fileContent,
          };

          field.onChange(document);
        }
      } catch (error) {
        console.error('Document picker error:', error);
      }
    };


    return (
      <View style={styles.uploadContainer}>
        <Text style={styles.label}>
          {label} {required && '*'}
        </Text>
        
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={pickDocument}
        >
          <Ionicons name="cloud-upload-outline" size={24} color="#f58634" />
          <Text style={styles.uploadButtonText}>
            {field.value?.name || 'Upload Document'}
          </Text>
        </TouchableOpacity>
        
        {field.value?.name && (
          <View style={styles.documentPreview}>
            <Ionicons name="document-text-outline" size={20} color="#666" />
            <Text style={styles.documentName} numberOfLines={1}>
              {field.value.name}
            </Text>
            <TouchableOpacity onPress={() => field.onChange(null)}>
              <Ionicons name="close-circle" size={20} color="#f44336" />
            </TouchableOpacity>
          </View>
        )}
        
        {errors[name] && (
          <Text style={styles.errorText}>{errors[name].message}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
  {/* Fixed Header */}
  
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0b184d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Text></Text>
      </View>

    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Personal Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Details</Text>

        <Controller
          control={control}
          name="address"
          rules={{ required: 'Address is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={[styles.input, errors.address && styles.errorInput]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.address && (
                <Text style={styles.errorText}>{errors.address.message}</Text>
              )}
            </View>
          )}
        />
        
        <Controller
          control={control}
          name="sin"
          rules={{ required: 'SIN is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>SIN (Social Insurance Number) *</Text>
              <TextInput
                style={[styles.input, errors.sin && styles.errorInput]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="numeric"
              />
              {errors.sin && (
                <Text style={styles.errorText}>{errors.sin.message}</Text>
              )}
            </View>
          )}
        />
        
        <Controller
          control={control}
          name="emergencyContact"
          rules={{ required: 'Emergency contact is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Emergency Contact Number *</Text>
              <TextInput
                style={[styles.input, errors.emergencyContact && styles.errorInput]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="phone-pad"
              />
              {errors.emergencyContact && (
                <Text style={styles.errorText}>{errors.emergencyContact.message}</Text>
              )}
            </View>
          )}
        />

            <Controller
                control={control}
                name="dateOfBirth"
                render={({ field: { onChange, value } }) => (
                <>
                <View style={styles.inputContainer}>
                <Text style={styles.label}>Date of Birth *</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.dateInput, errors.dateOfBirth && styles.errorInput]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.dateText}>
                      {value instanceof Date
                        ? format(value, 'yyyy-MM-dd')
                        : 'Select date'}
                    </Text>
                    <Ionicons name="calendar" size={20} color="#666" />
                  </TouchableOpacity>

                   {errors.dateOfBirth && (
                      <Text style={styles.errorText}>{errors.dateOfBirth.message}</Text>
                    )}
                </View>

              {showDatePicker && (
                <DateTimePicker
                  value={value instanceof Date ? value : new Date()}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      onChange(selectedDate); // save as Date object
                    }
                  }}
                />
              )}
          </>
        )}
      />

        <Controller
          control={control}
          name="driverlicensenumber"
          rules={{ required: 'Driver license number is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Driver License Number *</Text>
              <TextInput
                style={[styles.input, errors.driverlicensenumber && styles.errorInput]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="phone-pad"
              />
              {errors.driverlicensenumber && (
                <Text style={styles.errorText}>{errors.driverlicensenumber.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
            control={control}
            name="driverlicenseexpirationdate"
            rules={{ required: 'Driver license expiration date is required' }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Driver License Expiry Date *</Text>
                
                <TouchableOpacity
                  style={[styles.input, styles.dateInput, errors.driverlicenseexpirationdate && styles.errorInput]}
                  onPress={() => setShowLicenseDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {value ? format(new Date(value), 'yyyy-MM-dd') : 'Select date'}
                  </Text>
                  <Ionicons name="calendar" size={20} color="#666" />
                </TouchableOpacity>

                {errors.driverlicenseexpirationdate && (
                  <Text style={styles.errorText}>{errors.driverlicenseexpirationdate.message}</Text>
                )}

                {showLicenseDatePicker && (
                  <DateTimePicker
                    value={value ? new Date(value) : new Date()}
                    mode="date"
                    display="spinner"
                    minimumDate={new Date()} // expiry date can't be in the past
                    onChange={(event, selectedDate) => {
                      setShowLicenseDatePicker(false);
                      if (selectedDate) {
                        onChange(selectedDate.toISOString()); // store as ISO string
                      }
                    }}
                  />
                )}
              </View>
            )}
          />

      </View>

      {/* Bank Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bank Information</Text>
        
        <Controller
          control={control}
          name="transitNumber"
          rules={{ required: 'Transit number is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Transit Number *</Text>
              <TextInput
                style={[styles.input, errors.transitNumber && styles.errorInput]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="numeric"
              />
              {errors.transitNumber && (
                <Text style={styles.errorText}>{errors.transitNumber.message}</Text>
              )}
            </View>
          )}
        />
        
        <Controller
          control={control}
          name="institutionNumber"
          rules={{ required: 'Institution number is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Institution Number *</Text>
              <TextInput
                style={[styles.input, errors.institutionNumber && styles.errorInput]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="numeric"
              />
              {errors.institutionNumber && (
                <Text style={styles.errorText}>{errors.institutionNumber.message}</Text>
              )}
            </View>
          )}
        />
        
        <Controller
          control={control}
          name="accountNumber"
          rules={{ required: 'Account number is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Account Number *</Text>
              <TextInput
                style={[styles.input, errors.accountNumber && styles.errorInput]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="numeric"
              />
              {errors.accountNumber && (
                <Text style={styles.errorText}>{errors.accountNumber.message}</Text>
              )}
            </View>
          )}
        />
      </View>

      {/* Medical Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Information</Text>

        <DocumentUploadField
          name="educationDoc"
          label="Education Certificate (DSW, SSW, BSW)"
          required
          control={control}
          errors={errors}
        />

        <DocumentUploadField
          name="smgDoc"
          label="Safe Management Group (SMG)"
          required
          control={control}
          errors={errors}
        />

        <DocumentUploadField
          name="voidcheckDoc"
          label="Void Check"
          required
          control={control}
          errors={errors}
        />
        <DocumentUploadField
          name="ref1Doc"
          label="Reference 1"
          required
          control={control}
          errors={errors}
        />

        <DocumentUploadField
          name="ref2Doc"
          label="Reference 2"
          required
          control={control}
          errors={errors}
        />

        <DocumentUploadField
          name="ref3Doc"
          label="Reference 3"
          required
          control={control}
          errors={errors}
        />

        <DocumentUploadField
          name="vscDoc"
          label="Vunerable Sector Check / BRC"
          required
          control={control}
          errors={errors}
        />

        <DocumentUploadField
          name="medicalFitLetterDoc"
          label="Medical Fit Letter"
          required
          control={control}
          errors={errors}
        />
        
        <DocumentUploadField
          name="tuberculosisDoc"
          label="Tuberculosis Test Certificate"
          required
          control={control}
          errors={errors}
        />
        
        <DocumentUploadField
          name="covidVaccine1Doc"
          label="COVID Vaccine (Dose 1) Certificate"
          required
          control={control}
          errors={errors}
        />
        
        <DocumentUploadField
          name="covidVaccine2Doc"
          label="COVID Vaccine (Dose 2) Certificate"
          required
          control={control}
          errors={errors}
        />

        <DocumentUploadField
          name="resumeDoc"
          label="Resume"
          required
          control={control}
          errors={errors}
        />

        <DocumentUploadField
          name="driveAbstractDoc"
          label="Drive Abstract"
          required
          control={control}
          errors={errors}
        />

        <DocumentUploadField
          name="insuranceDoc"
          label="Insurance Pink Copy"
          required
          control={control}
          errors={errors}
        />

        <DocumentUploadField
          name="aodaDoc"
          label="AODA Certificate"
          required
          control={control}
          errors={errors}
        />

        <DocumentUploadField
          name="whimsDoc"
          label="Whims Certificate"
          required
          control={control}
          errors={errors}
        />

        <DocumentUploadField
          name="covidVaccineOptionalDoc"
          label="COVID Vaccine (Optional Booster) Certificate"
          control={control}
          errors={errors}
        />
        
        <DocumentUploadField
          name="firstAidCPRDoc"
          label="First Aid & CPR Certification"
          required
          control={control}
          errors={errors}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSubmit(onSubmit)}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        <Text style={styles.saveButtonText}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Text>
        {!isLoading && <Ionicons name="checkmark" size={20} color="#fff" />}
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0b184d',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    margin: 5,
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
  uploadContainer: {
    marginBottom: 15,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  uploadButtonText: {
    marginLeft: 10,
    color: '#666',
  },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    backgroundColor: '#f9f9f9',
  },
  documentName: {
    flex: 1,
    marginLeft: 8,
    color: '#666',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 15,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
});

export default EditProfile;