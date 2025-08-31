import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import Storage from '../components/storage';
import Toast from 'react-native-toast-message';

// ActivityItem component moved outside and properly memoized
const ActivityItem = React.memo(({ action, date, onPress }) => {
  // getIcon function moved inside since we can't use hooks here
  const getIcon = (action) => {
    const icons = {
      'check-in': { name: 'login', color: '#4caf50', title: 'Checked In' },
      'check-out': { name: 'logout', color: '#f44336', title: 'Checked Out' },
      'shift-swap': { name: 'swap-horiz', color: '#2196f3', title: 'Shift Swap' },
      'update-profile': { name: 'person', color: '#cc990eff', title: 'Profile Update' },
      default: { name: 'info', color: '#9e9e9e', title: 'Info' }
    };
    return icons[action] || icons.default;
  };

  const icon = getIcon(action);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.activityItem}
    >
      <MaterialIcons
        name="event"
        size={24}
        color="black"

        style={styles.iconMargin}
      />
      <View>
        <Text style={styles.activityTitle}>{action}</Text>
        <Text style={styles.activitySubtitle}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
});

export default function ActivitiesScreen() {
  const navigation = useNavigation();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [email, setEmail] = useState('');

  // Memoized getIcon function now correctly inside the component
  const getIcon = useMemo(() => (action) => {
    const icons = {
      'check-in': { name: 'login', color: '#4caf50', title: 'Checked In' },
      'check-out': { name: 'logout', color: '#f44336', title: 'Checked Out' },
      'shift-swap': { name: 'swap-horiz', color: '#2196f3', title: 'Shift Swap' },
      'update-profile': { name: 'person', color: '#cc990eff', title: 'Profile Update' },
      default: { name: 'info', color: '#9e9e9e', title: 'Info' }
    };
    return icons[action] || icons.default;
  }, []);

  // Rest of the component remains the same...
  const fetchActivities = useCallback(async (currentPage = 1, isRefreshing = false) => {
    if (!email) return;

    try {
      isRefreshing ? setRefreshing(true) : setLoading(true);
      
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('page', currentPage);
      params.append('per_page', 10);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/fetchallactivities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const data = await res.json();

      if (data?.status) {
        setActivities(prev => 
          currentPage === 1 ? data.data : [...prev, ...data.data]
        );
        setTotalPages(data?.data?.pagination?.total_pages || 1);
        setPage(currentPage);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to fetch activities'
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [email]);

  useEffect(() => {
    const loadEmail = async () => {
      try {
        const userEmail = await Storage.getItem('userToken');
        userEmail ? setEmail(userEmail) : navigation.replace('Login');
      } catch (error) {
        navigation.replace('Login');
      }
    };
    loadEmail();
  }, []);

  useEffect(() => {
    if (email) fetchActivities(1);
  }, [email, fetchActivities]);

  const handleRefresh = useCallback(() => fetchActivities(1, true), [fetchActivities]);
  const handleLoadMore = useCallback(() => {
    if (page < totalPages && !loading) fetchActivities(page + 1);
  }, [page, totalPages, loading, fetchActivities]);

  const renderFooter = useMemo(() => {
    return loading ? (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#0b184d" />
      </View>
    ) : null;
  }, [loading]);

  const renderEmptyComponent = useMemo(() => {
    return !loading ? <Text style={styles.emptyText}>No activities found</Text> : null;
  }, [loading]);

  const keyExtractor = useCallback((item) => `${item.id}-${item.date}`, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={navigation.goBack} 
          style={styles.backButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activities</Text>
      </View>

      <FlatList
        data={activities.data}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ActivityItem
            {...item}
            onPress={() => navigation.navigate('ActivityDetails', { 
              activity: item 
            })}
          />
        )}
        ListEmptyComponent={renderEmptyComponent}
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
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={11}
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
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 12
  },
  iconMargin: {
    marginRight: 12
  },
  activityTitle: {
    fontWeight: '600',
    fontSize: 16
  },
  activitySubtitle: {
    color: '#555',
    fontSize: 12
  },
  listContent: {
    paddingBottom: 20
  },
  footer: {
    paddingVertical: 20
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666'
  }
});