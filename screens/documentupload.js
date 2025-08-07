import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DocumentUpload = ({ navigation, route }) => {
  // Document state
  const [documents, setDocuments] = useState({
    educationalDoc: null,
    driverLicense: { file: null, issueDate: '', expiryDate: '' },
    smgCert: null,
    voidCheck: null,
    references: [],
    vulnerableSectorCheck: null,
    medicalFitLetter: null,
    certifications: []
  });

  // Load saved documents
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const savedDocs = await AsyncStorage.getItem('userDocuments');
        if (savedDocs) {
          setDocuments(JSON.parse(savedDocs));
        }
      } catch (error) {
        console.error('Failed to load documents', error);
      }
    };
    loadDocuments();
  }, []);

  // Handle document picker
  const pickDocument = async (field) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: false
      });
      
      if (result.type === 'success') {
        setDocuments(prev => ({
          ...prev,
          [field]: {
            name: result.name,
            uri: result.uri,
            type: result.mimeType
          }
        }));
      }
    } catch (error) {
      console.error('Document picker error:', error);
    }
  };

  // Handle date input change
  const handleDateChange = (field, date, subField) => {
    setDocuments(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [subField]: date
      }
    }));
  };

  // Add reference
  const addReference = () => {
    if (documents.references.length < 3) {
      setDocuments(prev => ({
        ...prev,
        references: [...prev.references, { file: null }]
      }));
    }
  };

  // Add certification
  const addCertification = () => {
    setDocuments(prev => ({
      ...prev,
      certifications: [...prev.certifications, { file: null }]
    }));
  };

  // Remove item from array
  const removeArrayItem = (field, index) => {
    setDocuments(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Handle save
  const handleSave = async () => {
    try {
      await AsyncStorage.setItem('userDocuments', JSON.stringify(documents));
      Alert.alert('Success', 'Documents saved successfully');
      navigation.navigate('Profile');
    } catch (error) {
      console.error('Failed to save documents', error);
      Alert.alert('Error', 'Failed to save documents');
    }
  };

  // Render file upload button
  const renderUploadButton = (field, label, required = true) => (
    <View style={styles.uploadContainer}>
      <Text style={styles.label}>
        {label} {required && '*'}
      </Text>
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => pickDocument(field)}
      >
        <Text style={styles.uploadButtonText}>
          {documents[field] ? 'Change File' : 'Upload PDF'}
        </Text>
      </TouchableOpacity>
      {documents[field] && (
        <View style={styles.fileInfo}>
          <Ionicons name="document-text" size={16} color="#0b184d" />
          <Text style={styles.fileName} numberOfLines={1}>
            {documents[field].name}
          </Text>
        </View>
      )}
    </View>
  );

  // Render date input
  const renderDateInput = (label, value, onChange) => (
    <View style={styles.dateInputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => {
          // Implement date picker here
          // For example: show DateTimePicker modal
        }}
      >
        <Text>{value || 'Select date'}</Text>
        <Ionicons name="calendar" size={20} color="#0b184d" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0b184d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Document Upload</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Document Upload Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Required Documents</Text>
        
        {renderUploadButton('educationalDoc', 'Educational Document')}
        
        {/* Driver License */}
        <View style={styles.uploadContainer}>
          <Text style={styles.label}>Driver License *</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickDocument('driverLicense')}
          >
            <Text style={styles.uploadButtonText}>
              {documents.driverLicense.file ? 'Change File' : 'Upload PDF'}
            </Text>
          </TouchableOpacity>
          {documents.driverLicense.file && (
            <View style={styles.fileInfo}>
              <Ionicons name="document-text" size={16} color="#0b184d" />
              <Text style={styles.fileName} numberOfLines={1}>
                {documents.driverLicense.file.name}
              </Text>
            </View>
          )}
          {renderDateInput('Issue Date', documents.driverLicense.issueDate, 
            (date) => handleDateChange('driverLicense', date, 'issueDate'))}
          {renderDateInput('Expiry Date', documents.driverLicense.expiryDate, 
            (date) => handleDateChange('driverLicense', date, 'expiryDate'))}
        </View>
        
        {renderUploadButton('smgCert', 'Safe Management Group (SMG) Certificate')}
        {renderUploadButton('voidCheck', 'Void Check')}
        
        {/* References */}
        <View style={styles.uploadContainer}>
          <Text style={styles.label}>References (3 required) *</Text>
          {documents.references.map((ref, index) => (
            <View key={index} style={styles.referenceItem}>
              <TouchableOpacity
                style={[styles.uploadButton, { flex: 1 }]}
                onPress={() => pickDocument(`references[${index}]`)}
              >
                <Text style={styles.uploadButtonText}>
                  {ref.file ? 'Change File' : 'Upload PDF'}
                </Text>
              </TouchableOpacity>
              {ref.file && (
                <View style={styles.fileInfo}>
                  <Ionicons name="document-text" size={16} color="#0b184d" />
                  <Text style={styles.fileName} numberOfLines={1}>
                    {ref.file.name}
                  </Text>
                </View>
              )}
              {index > 0 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeArrayItem('references', index)}
                >
                  <Ionicons name="trash" size={20} color="#f44336" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {documents.references.length < 3 && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={addReference}
            >
              <Ionicons name="add" size={20} color="#f58634" />
              <Text style={styles.addButtonText}>Add Reference</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {renderUploadButton('vulnerableSectorCheck', 'Vulnerable Sector Check/BRC')}
        {renderUploadButton('medicalFitLetter', 'Medical Fit Letter (Optional)', false)}
      </View>

      {/* Certifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Certifications</Text>
        
        {documents.certifications.map((cert, index) => (
          <View key={index} style={styles.referenceItem}>
            <TouchableOpacity
              style={[styles.uploadButton, { flex: 1 }]}
              onPress={() => pickDocument(`certifications[${index}]`)}
            >
              <Text style={styles.uploadButtonText}>
                {cert.file ? 'Change File' : 'Upload PDF'}
              </Text>
            </TouchableOpacity>
            {cert.file && (
              <View style={styles.fileInfo}>
                <Ionicons name="document-text" size={16} color="#0b184d" />
                <Text style={styles.fileName} numberOfLines={1}>
                  {cert.file.name}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeArrayItem('certifications', index)}
            >
              <Ionicons name="trash" size={20} color="#f44336" />
            </TouchableOpacity>
          </View>
        ))}
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={addCertification}
        >
          <Ionicons name="add" size={20} color="#f58634" />
          <Text style={styles.addButtonText}>Add Certification</Text>
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>Save Documents</Text>
        <Ionicons name="checkmark" size={20} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
};

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
  uploadContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: '#eaf1ff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0b184d',
    marginBottom: 8,
  },
  uploadButtonText: {
    color: '#0b184d',
    fontWeight: '500',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  fileName: {
    marginLeft: 5,
    color: '#666',
    fontSize: 12,
    flexShrink: 1,
  },
  dateInputContainer: {
    marginBottom: 15,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fafafa',
  },
  referenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  removeButton: {
    marginLeft: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  addButtonText: {
    color: '#f58634',
    marginLeft: 5,
    fontWeight: '500',
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

export default DocumentUpload;