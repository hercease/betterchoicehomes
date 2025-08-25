import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, RefreshControl, Platform, Modal, KeyboardAvoidingView, ScrollView,ActivityIndicator, StyleSheet, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller, useController  } from 'react-hook-form';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { API_URL, APP_NAME } from '@env';
import Storage from '../components/storage';
import Toast from 'react-native-toast-message';
import * as Network from 'expo-network';

const EditProfile = ({ navigation }) => {

  const [showLicenseDatePicker, setShowLicenseDatePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userDocuments, setUserDocuments] = useState("");
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const { control, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({ mode: 'onChange' });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const confirmAndSubmit = () => {
    setShowConfirm(false);
    handleSubmit(onSubmit)();
  };

  const onRefresh = React.useCallback(async () => {
    try {
    setRefreshing(true);
    await fetchUserDocuments();
  } catch (error) {
    //console.error("Refresh error:", error);
    Toast.show({
      type: 'error',
      text1: 'Refresh failed',
      text2: error.message,
    });
  } finally {
    setRefreshing(false); // Ensure spinner stops even if fetch fails
  }
  }, [fetchUserDocuments]);

const onSubmit = async (data) => {
  setIsLoading(true);

  try {
    // 1. Check network connection
    const netState = await Network.getNetworkStateAsync();
    if (!netState.isConnected) {
      throw new Error('No internet connection');
    }

    // 2. Verify authentication
    const authToken = await Storage.getItem('userToken');
    if (!authToken) {
      navigation.replace('Login');
      return;
    }

    // 3. Prepare form data
    const formData = new FormData();
    formData.append("email", authToken);
    formData.append("timezone", timezone);

    // 4. Add regular form fields
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        return; // Skip file-type objects
      }
      formData.append(key, value instanceof Date ? value.toISOString() : value);
    });

    // 5. Handle document uploads
    userDocuments.documents.forEach(doc => {
      const fieldValue = data[doc.tag];
      if (fieldValue?.isNewUpload) {
        if (fieldValue.size > 5 * 1024 * 1024) {
          throw new Error(`${doc.title} exceeds 5MB limit`);
        }
        formData.append('documents[]', {
          uri: fieldValue.uri,
          name: fieldValue.name,
          type: fieldValue.type,
        });
        formData.append('document_tags[]', doc.tag);
      }
    });

    // 6. Handle certificate uploads (skip empty)
    userDocuments.certifications.forEach(cert => {
      const fieldValue = data[cert.cert_tag];
      // Skip if no new file uploaded
      if (fieldValue?.isNewUpload){

        if (fieldValue.size > 5 * 1024 * 1024) {
          throw new Error(`Certificate ${index + 1} exceeds 5MB limit`);
        }

        formData.append('certificates[]', {
          uri: fieldValue.uri,
          name: fieldValue.name,
          type: fieldValue.type,
        });
        formData.append('certificate_tags[]', cert.cert_tag);
      }
    });

    console.log(formData);

    // 7. API request
    const response = await fetch(`${API_URL}/updateprofile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(progress);
      },
    });

    const responseData = await response.json();
    if (!response.ok || !responseData.status) {
      throw new Error(responseData.message || 'Update failed');
    }

    // 8. Success
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Profile updated successfully',
      visibilityTime: 4000,
    });

    // 9. Refresh data
    await fetchUserDocuments();

  } catch (error) {
    //console.error('Submission error:', error);
    const isSizeError = error.message.includes('exceed');
    Toast.show({
      type: 'error',
      text1: isSizeError ? 'File Too Large' : 'Error',
      text2: error.message,
      position: 'bottom',
      visibilityTime: 5000,
    });
  } finally {
    setIsLoading(false);
    setUploadProgress(0);
  }
};

 const fetchUserDocuments = React.useCallback(async () => {
    try {

      setLoadingDocuments(true);
      setUserDocuments([]);
      const authToken = await Storage.getItem('userToken');
      if (!authToken) {
        navigation.replace('Login');
      }
      const params = new URLSearchParams();
      params.append('email', authToken);
      const response = await fetch(`${API_URL}/fetchprofileinfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(), // URLSearchParams handles encoding
      });
      
      if (!response.ok) throw new Error('Failed to fetch documents');
     
      const data = await response.json();
       if(data.status){

          //console.log(data.data);
          setUserDocuments(data.data);

            let resetValues = {
              address: data.data.address || '',
              sin: data.data.sin || '',
              dateOfBirth: data.data.dob || '',
              emergencyContact: data.data.contact_number || '',
              driverlicensenumber: data.data.driver_license_number || '',
              driverlicenseexpirationdate: data.data.driver_license_expiry_date || '',
              transitNumber: data.data.transit_number || '',
              institutionNumber: data.data.institution_number || '',
              accountNumber: data.data.account_number || '',
              province: data.data.province || '',
              city: data.data.city || '',
              postal_code: data.data.postal_code || '',
            };

           if (data.data.documents) {
              data.data.documents.forEach(doc => {
                resetValues[doc.tag] = doc.file_name
                  ? {
                      name: doc.file_name,
                      uri: doc.file_url,
                      type: 'application/pdf',
                      isApproved: doc.isApproved,
                      optional: doc.optional
                    }
                  : null;
              });
            }

            if (data.data.certifications) {
              data.data.certifications.forEach((cert, index) => {
                resetValues[cert.cert_tag] = cert.file_name
                  ? {
                      name: cert.file_name,
                      uri: cert.file_url,
                      type: 'application/pdf',
                      isApproved: cert.isApproved,
                      optional: cert.optional
                    }
                  : null;
              });
            }

          

          reset(resetValues);

          return true;

       } else {

          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: data.message
          });

       }
      
      
    } catch (error) {
      //console.error('Fetch error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load documents',
        text2: error.message
      });
    } finally {
      setLoadingDocuments(false);
    }
  }, [API_URL, navigation]);


  useEffect(() => {
    fetchUserDocuments();
  }, []);

  const DocumentUploadField = ({ 
  name, 
  label, 
  required, 
  control, 
  errors,
  existingDoc 
}) => {
   const isRequired = !existingDoc?.optional && !existingDoc?.isApproved;

  const { field } = useController({
    control,
    name,
    rules: isRequired 
      ? { required: `${label} is required` }
      : {},
  });

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {

       
        const file = result.assets[0];
         if (file.size && file.size > 5 * 1024 * 1024) {
          throw new Error("File is too large! Please choose a file smaller than 6MB.");
        }
        const fileContent = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        field.onChange({
          name: file.name,
          type: file.mimeType,
          size: file.size,
          uri: file.uri,
          base64: fileContent,
          isNewUpload: true // Flag new uploads
        });
      }
    } catch (error) {
      //console.error('Document picker error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load documents',
        text2: error.message
      });
    }
  };

  return (
    <View style={styles.uploadContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={styles.label}>
          {label} {required && '*'}
        </Text>
        {existingDoc?.isApproved && (
          <View style={styles.approvedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.approvedText}>Approved</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={[
          styles.uploadButton,
          existingDoc?.isApproved && styles.approvedUpload
        ]}
        onPress={pickDocument}
        disabled={existingDoc?.isApproved}
      >
        <Ionicons 
          name={existingDoc?.isApproved ? "checkmark-circle-outline" : "cloud-upload-outline"} 
          size={24} 
          color={existingDoc?.isApproved ? "#4CAF50" : "#f58634"} 
        />
        <Text style={styles.uploadButtonText}>
          {field.value?.name || existingDoc?.file_name || 'Upload Document'}
        </Text>
      </TouchableOpacity>
      
      {/* Document preview and remove button */}
      {(field.value?.name || existingDoc?.file_name) && (
        <View style={styles.documentPreview}>
          <Ionicons name="document-text-outline" size={20} color="#666" />
          <Text style={styles.documentName} numberOfLines={1}>
            {field.value?.name || existingDoc?.file_name}
          </Text>
          {(!existingDoc?.isApproved) && (
            <TouchableOpacity onPress={() => field.onChange(null)}>
              <Ionicons name="close-circle" size={20} color="#f44336" />
            </TouchableOpacity>
          )}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
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

    <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f58634', '#1c37afff']} />} contentContainerStyle={{ paddingBottom: 40 }}>
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
                placeholder="Address"
                placeholderTextColor="#999"
              />
              {errors.address && (
                <Text style={styles.errorText}>{errors.address.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="city"
          rules={{ required: 'City is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={[styles.input, errors.city && styles.errorInput]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="City"
                placeholderTextColor="#999"
              />
              {errors.city && (
                <Text style={styles.errorText}>{errors.city.message}</Text>
              )}
            </View>
          )}
        />

         <Controller
          control={control}
          name="province"
          rules={{ required: 'Province is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Province *</Text>
              <TextInput
                style={[styles.input, errors.province && styles.errorInput]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Province"
                placeholderTextColor="#999"
              />
              {errors.province && (
                <Text style={styles.errorText}>{errors.province.message}</Text>
              )}
            </View>
          )}
        />

         <Controller
          control={control}
          name="postal_code"
          rules={{ required: 'Postal Code is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Postal Code *</Text>
              <TextInput
                style={[styles.input, errors.postal_code && styles.errorInput]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Postal Code"
                placeholderTextColor="#999"
              />
              {errors.postal_code && (
                <Text style={styles.errorText}>{errors.postal_code.message}</Text>
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
                placeholder="Social Insurance Number"
                placeholderTextColor="#999"
                
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
                placeholder="Emergency Contact Number"
                placeholderTextColor="#999"
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
                rules={{ required: 'Date of birth is required' }}
                render={({ field: { onChange, value } }) => (
                <>
                <View style={styles.inputContainer}>
                <Text style={styles.label}>Date of Birth *</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.dateInput, errors.dateOfBirth && styles.errorInput]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.dateText}>
                      {value ? format(new Date(value), 'yyyy-MM-dd') : 'Select date'}
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

      </View>

      {/* Driver license Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Driver license Information</Text>

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
                placeholder="Driver License Number"
                placeholderTextColor="#999"
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
                value={value || userDocuments?.userdetails?.transitNumber}
                keyboardType="numeric"
                placeholder="Transit Number"
                placeholderTextColor="#999"
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
                value={value || userDocuments?.institutionNumber}
                keyboardType="numeric"
                placeholder="Institution Number"
                placeholderTextColor="#999"
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
                value={value || userDocuments?.userdetails?.accountNumber}
                keyboardType="numeric"
                placeholder="Acount Number"
                placeholderTextColor="#999"
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
        <Text style={styles.sectionTitle}>Document Upload</Text>

          {loadingDocuments ? (
            <ActivityIndicator size="large" color="#f58634" />
          ) : (
            userDocuments && userDocuments?.documents.map(doc => (
              <DocumentUploadField
                key={doc.tag}
                name={doc.tag}
                label={doc.title}
                required={doc.isApproved}
                control={control}
                errors={errors}
                existingDoc={doc}
              />
            ))
          )}

      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Certifications (If Any)</Text>

        {loadingDocuments ? (
          <ActivityIndicator size="large" color="#f58634" />
        ) : (
        userDocuments && userDocuments?.certifications.map((cert) => (
            <DocumentUploadField
              key={cert.cert_tag}
              name={cert.cert_tag}
              label={cert.title} // Keep optional
              control={control}
              errors={errors}
              existingDoc={cert}
            />
          ))
        )}

      </View>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
          <Text style={styles.progressText}>{uploadProgress}%</Text>
        </View>
      )}
      
      {/* Save Button */}
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={() => setShowConfirm(true)}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        <Text style={styles.saveButtonText}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>

       <Modal
        transparent
        visible={showConfirm}
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Changes</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to save these changes?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                onPress={() => setShowConfirm(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
                onPress={confirmAndSubmit}
              >
                <Text style={{ color: '#fff' }}>Yes, Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
    </KeyboardAvoidingView>
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
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'center',
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
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  approvedText: {
    color: '#4CAF50',
    fontSize: 12,
    marginLeft: 4
  },
  approvedUpload: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50'
  },
  progressContainer: {
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#f58634',
  },
  progressText: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    width: '100%',
    textAlign: 'center',
  },

  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContent: {
  width: '80%',
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 20,
},
modalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 10,
},
modalMessage: {
  fontSize: 14,
  marginBottom: 20,
},
modalButtons: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  gap: 10,
},
modalButton: {
  paddingHorizontal: 15,
  paddingVertical: 8,
  borderRadius: 5,
},

  
});

export default EditProfile;