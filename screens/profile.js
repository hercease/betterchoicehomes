import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavBar from '../components/BottomNav';
import Storage from '../components/storage';
import Toast from 'react-native-toast-message';

export default function ProfilePage ({navigation}) {

 const [refreshing, setRefreshing] = useState(false);
 const [userDocuments, setUserDocuments] = useState([]);
 const [loadingDocuments, setLoadingDocuments] = useState(true);
 
 const getInitials = (fullName) => {
  const names = fullName.trim().split(' ');
  if (names.length === 1) return names[0][0].toUpperCase();
  return `${names[0][0]}${names[1][0]}`.toUpperCase();
};

   const fetchUserDocuments = React.useCallback(async () => {
    try {

      setLoadingDocuments(true);
      setUserDocuments([]);
      const authToken = await Storage.getItem('userToken');
      if (!authToken) {
        navigation.replace('Login');
        return;
      }
      const params = new URLSearchParams();
      params.append('email', authToken);
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/fetchprofileinfo`, {
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
      setRefreshing(false);
    }
  }, [navigation]);


  useEffect(() => {
    fetchUserDocuments();
  }, []);

 

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserDocuments();
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.initialsAvatar}>
          <Text style={styles.initialsText}>{getInitials(userDocuments?.firstname + ' ' + userDocuments?.lastname)}</Text>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={styles.scrollContent}>
        {/* Personal Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}><Ionicons name="id-card-outline" size={14} /> Personal Information</Text>
          <View style={styles.infoGroup}><Text style={styles.label}>FirstName</Text><Text style={styles.infoText}>{userDocuments?.firstname}</Text></View>
          <View style={styles.infoGroup}><Text style={styles.label}>LastName</Text><Text style={styles.infoText}>{userDocuments?.lastname}</Text></View>
          <View style={styles.infoGroup}><Text style={styles.label}>Email</Text><Text style={styles.infoText}>{userDocuments?.email}</Text></View>
          <View style={styles.infoGroup}><Text style={styles.label}>Contact Number</Text><Text style={styles.infoText}>{userDocuments?.contact_number}</Text></View>
          <View style={styles.infoGroup}><Text style={styles.label}>Date of Birth</Text><Text style={styles.infoText}>{userDocuments?.dob}</Text></View>
          <View style={styles.infoGroup}><Text style={styles.label}>Address</Text><Text style={styles.infoText}>{userDocuments?.address}</Text></View>
        </View>

        {/* Bank Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}><Ionicons name="home-outline" size={14} /> Bank Information</Text>
          <View style={styles.infoGroup}><Text style={styles.label}>Account No</Text><Text style={styles.infoText}>{userDocuments?.account_number}</Text></View>
          <View style={styles.infoGroup}><Text style={styles.label}>Transit No</Text><Text style={styles.infoText}>{userDocuments?.transit_number}</Text></View>
          <View style={styles.infoGroup}><Text style={styles.label}>Institution No</Text><Text style={styles.infoText}>{userDocuments?.institution_number}</Text></View>
          <View style={styles.infoGroup}><Text style={styles.label}>SIN</Text><Text style={styles.infoText}>{userDocuments?.sin}</Text></View>
        </View>

        {/* Bank Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}><Ionicons name="car-outline" size={14} /> Driver License Information</Text>
          <View style={styles.infoGroup}><Text style={styles.label}>Expiry Date</Text><Text style={styles.infoText}>{userDocuments?.driver_license_expiry_date}</Text></View>
          <View style={styles.infoGroup}><Text style={styles.label}>License No</Text><Text style={styles.infoText}>{userDocuments?.driver_license_number}</Text></View>
        </View>

        {/* Documents */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}><Ionicons name="document" size={14} /> Uploaded Documents</Text>
          {userDocuments?.documents && userDocuments?.documents.map((doc, index) => (
            <View key={index} style={styles.infoGroup}>
              <Text style={styles.label}>{doc.title}</Text>
              <View style={styles.documentRow}>
                <Text style={styles.infoText}>{doc.file_name}</Text>
                <Ionicons
                  name={doc.isApproved ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={doc.isApproved ? 'green' : 'red'}
                  style={{ marginLeft: 8 }}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Edit Button */}
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>
       {/* Bottom Navigation */}
      <BottomNavBar navigation={navigation} />
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 50,
  },
  header: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomColor: '#ddd',
    zIndex: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#f58634',
    marginBottom: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0b184d',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 130,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 20,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#0b184d',
  },
  infoGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: '#777',
    marginBottom: 3,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#f58634',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  initialsAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f58634', // You can randomize color if you want
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  initialsText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },

});
