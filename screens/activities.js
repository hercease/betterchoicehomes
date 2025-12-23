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
import Storage from '../components/storage';
import Toast from 'react-native-toast-message';
import ActivityItem from '../components/Activity';

export default function ActivitiesScreen() {
  const navigation = useNavigation();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [email, setEmail] = useState('');

  const fetchActivities = useCallback(async (page = 1, isRefreshing = false) => {
    if (!email) return;

    try {
      isRefreshing ? setRefreshing(true) : setLoading(true);
      
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('page', page);
      params.append('per_page', 5);

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

      console.log('Activities:', data.data.data);

      if (data?.status) {
        setActivities(data.data.data || []);
        setTotalPages(data?.data?.pagination?.total_pages || 1);
        setCurrentPage(page);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data?.message || 'Failed to fetch activities'
        });
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

  const handleRefresh = useCallback(() => {
    fetchActivities(1, true);
  }, [fetchActivities]);

  const handleNextPage = () => {
    if (currentPage < totalPages && !loading) {
      fetchActivities(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1 && !loading) {
      fetchActivities(currentPage - 1);
    }
  };

  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === 1 && styles.disabledButton
          ]}
          onPress={handlePrevPage}
          disabled={currentPage === 1 || loading}
        >
          <Text style={[
            styles.paginationButtonText,
            currentPage === 1 && styles.disabledButtonText
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

        <View style={styles.pageInfo}>
          <Text style={styles.pageInfoText}>
            Page {currentPage} of {totalPages}
          </Text>
          {loading && <ActivityIndicator size="small" color="#0b184d" style={styles.pageLoader} />}
        </View>

        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === totalPages && styles.disabledButton
          ]}
          onPress={handleNextPage}
          disabled={currentPage === totalPages || loading}
        >
          <Text style={[
            styles.paginationButtonText,
            currentPage === totalPages && styles.disabledButtonText
          ]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyComponent = () => {
    return !loading ? <Text style={styles.emptyText}>No activities found</Text> : null;
  };

  const keyExtractor = useCallback((item, index) => `${item.id}-${item.date}-${index}`, []);

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

      {renderPaginationControls()}

      <FlatList
        data={activities}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          activities.length === 0 && styles.emptyListContent
        ]}
        
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 5,
  },
  paginationButton: {
    backgroundColor: '#0b184d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  paginationButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButtonText: {
    color: '#666666',
  },
  pageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageInfoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 8,
  },
  pageLoader: {
    marginLeft: 8,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontSize: 16,
  },
});