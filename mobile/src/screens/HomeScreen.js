import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api';
import { getCurrentUser, logout } from '../api/auth';
import socketService from '../utils/socket';

const HomeScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useFocusEffect(
    useCallback(() => {
      loadData();
      setupSocketListeners();
      
      return () => {
        cleanupSocketListeners();
      };
    }, [])
  );

  const loadData = async () => {
    try {
      const [userResponse, currentUserData] = await Promise.all([
        api.get('/users'),
        getCurrentUser()
      ]);
      
      setUsers(userResponse.data.users || []);
      setCurrentUser(currentUserData);
    } catch (error) {
      console.error('Load users error:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('user:online', (userId) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    socketService.on('user:offline', (userId) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    socketService.on('users:online', (userIds) => {
      setOnlineUsers(new Set(userIds));
    });

    socketService.on('message:notification', (message) => {
      // Show notification or update UI
      console.log('New message notification:', message);
    });
  };

  const cleanupSocketListeners = () => {
    socketService.off('user:online');
    socketService.off('user:offline');
    socketService.off('users:online');
    socketService.off('message:notification');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUserPress = async (user) => {
    try {
      // Create or get conversation
      const response = await api.post('/conversations/create', {
        participantId: user._id
      });
      
      navigation.navigate('Chat', {
        conversationId: response.data.conversation._id,
        recipientId: user._id,
        recipientName: user.name,
        recipientAvatar: user.avatar
      });
    } catch (error) {
      console.error('Create conversation error:', error);
      Alert.alert('Error', 'Failed to start conversation');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              socketService.disconnect();
              await logout();
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }) => {
    const isOnline = onlineUsers.has(item._id);
    
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserPress(item)}
      >
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={[styles.userStatus, { color: isOnline ? '#4CAF50' : '#999' }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Chats</Text>
          <Text style={styles.headerSubtitle}>
            {users.length} user{users.length !== 1 ? 's' : ''} available
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Current User Info */}
      {currentUser && (
        <View style={styles.currentUserContainer}>
          <View style={styles.currentUserInfo}>
            <Ionicons name="person-circle" size={24} color="#007AFF" />
            <Text style={styles.currentUserText}>
              Signed in as {currentUser.name}
            </Text>
          </View>
          <View style={styles.onlineStatusContainer}>
            <View style={styles.onlineIndicator} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
      )}

      {/* Users List */}
      <FlatList
        data={users.filter(user => user._id !== currentUser?._id)}
        renderItem={renderUserItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>No users found</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
  currentUserContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  currentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentUserText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  onlineStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  listContent: {
    flexGrow: 1,
  },
  userItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#C7C7CC',
    marginTop: 16,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
