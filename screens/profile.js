import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavBar from '../components/BottomNav';

export default function ProfilePage ({navigation}) {
 const [refreshing, setRefreshing] = useState(false);
 const getInitials = (fullName) => {
  const names = fullName.trim().split(' ');
  if (names.length === 1) return names[0][0].toUpperCase();
  return `${names[0][0]}${names[1][0]}`.toUpperCase();
};

  const user = {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+234 810 000 0000',
    fullName: 'Jane Doe',
    gender: 'Female',
    dob: 'Jan 1, 1998',
    address: '12, Unity Road, Lagos',
    documents: [
      { tag: 'National ID', title: 'nid_front.jpg' },
      { tag: 'Utility Bill', title: 'nepa_march_2025.pdf' },
      { tag: 'Passport', title: 'passport_photo.jpg' },
    ],
  };

 

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000); // simulate refresh
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.initialsAvatar}>
          <Text style={styles.initialsText}>{getInitials(user.fullName)}</Text>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={styles.scrollContent}>
        {/* Personal Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}><Ionicons name="person" size={14} /> Personal Information</Text>
          <View style={styles.infoGroup}><Text style={styles.label}>Email</Text><Text style={styles.infoText}>{user.email}</Text></View>
          <View style={styles.infoGroup}><Text style={styles.label}>Phone Number</Text><Text style={styles.infoText}>{user.phone}</Text></View>
          <View style={styles.infoGroup}><Text style={styles.label}>Gender</Text><Text style={styles.infoText}>{user.gender}</Text></View>
          <View style={styles.infoGroup}><Text style={styles.label}>Date of Birth</Text><Text style={styles.infoText}>{user.dob}</Text></View>
          <View style={styles.infoGroup}><Text style={styles.label}>Address</Text><Text style={styles.infoText}>{user.address}</Text></View>
        </View>

        {/* Documents */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}><Ionicons name="document" size={14} /> Uploaded Documents</Text>
          {user.documents.map((doc, index) => (
            <View key={index} style={styles.infoGroup}>
              <Text style={styles.label}>{doc.tag}</Text>
              <View style={styles.documentRow}>
                <Text style={styles.infoText}>{doc.title}</Text>
                <Ionicons
                  name={doc.confirmed ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={doc.confirmed ? 'green' : 'red'}
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
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
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
