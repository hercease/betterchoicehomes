import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '@env';
import Storage from '../components/storage';

// Helper: return icon details based on action
const getIcon = (action) => {
  switch (action) {
    case 'check-in':
      return { name: 'login', color: '#4caf50', title: 'Checked In' };
    case 'check-out':
      return { name: 'logout', color: '#f44336', title: 'Checked Out' };
    case 'shift-swap':
      return { name: 'swap-horiz', color: '#2196f3', title: 'Shift Swap' };
    case 'update-document':
      return { name: 'description', color: '#cc990eff', title: 'Document Update' };
    default:
      return { name: 'info', color: '#9e9e9e', title: 'Info' };
  }
};

const ActivityItem = ({ action, date, onPress }) => {
  const icon = getIcon(action);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#f8f8f8',
        borderRadius: 12
      }}
    >
      <MaterialIcons
        name={icon.name}
        size={24}
        color={icon.color}
        style={{ marginRight: 12 }}
      />
      <View>
        <Text style={{ fontWeight: '600', fontSize: 16 }}>{icon.title}</Text>
        <Text style={{ color: '#555', fontSize: 12 }}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function ActivitiesScreen() {
  const navigation = useNavigation();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [email, setEmail] = useState('');

  // Fetch activities from API
  const fetchActivities = useCallback(
    async (currentPage = 1, isRefreshing = false) => {
      if (!email) return;

      if (isRefreshing) {
        setRefreshing(true);
        setPage(1);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        params.append('email', email);
        params.append('page', currentPage);
        params.append('per_page', 10);

        const res = await fetch(`${API_URL}/fetchallactivities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });

        const data = await res.json();
        //console.log('Total pages:', data?.data?.pagination?.total_pages);

        if (data.status) {
          setActivities((prev) =>
            currentPage === 1 ? data.data : [...prev, ...data.data]
          );
          setTotalPages(data?.data?.pagination?.total_pages || 1);
          setPage(currentPage);
        }
      } catch (error) {
        //console.error('Error fetching activities:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Error fetching activities:', error,
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [email] // ✅ removed `activities` to stop infinite loop
  );

  //console.log(activities.data);

  // Load user email once on mount
  useEffect(() => {
    const loadEmail = async () => {
      const userEmail = await Storage.getItem('userToken');
      if (!userEmail) {
        navigation.replace('Login');
        return;
      }
      setEmail(userEmail);
    };
    loadEmail();
  }, []);

  // Fetch activities when email is available
  useEffect(() => {
    if (email) {
      fetchActivities(1);
    }
  }, [email, fetchActivities]);

  const handleRefresh = () => {
    fetchActivities(1, true);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loading) {
      fetchActivities(page + 1);
    }
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color="#0b184d" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activities</Text>
      </View>

      {/* List */}
      <FlatList
        data={activities.data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ActivityItem
            {...item}
            onPress={() => navigation.navigate('ActivityDetails', { activity: item })}
          />
        )}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>No activities found</Text> : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0b184d']}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0b184d',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  activityTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: '#0b184d',
  },
  activitySubtitle: {
    color: '#555',
    fontSize: 12,
  },
});
