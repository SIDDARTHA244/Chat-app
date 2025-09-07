import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🚨 YOUR SPECIFIC IP ADDRESS
const SOCKET_URL = 'http://192.168.1.100:5000';

class SocketService {
  socket = null;
  isConnected = false;
  reconnectAttempts = 0;
  maxReconnectAttempts = 5;

  async connect() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'], // Essential for React Native
        jsonp: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000,
        forceNew: true
      });

      this.setupEventListeners();
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket.on('connect', () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('✅ Connected to socket server');
          resolve(this.socket);
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('❌ Socket connection error:', error.message);
          reject(error);
        });
      });
    } catch (error) {
      console.error('❌ Socket connection setup error:', error);
      throw error;
    }
  }

  setupEventListeners() {
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.isConnected = true;
      console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on('reconnect_error', (error) => {
      this.reconnectAttempts++;
      console.error(`❌ Socket reconnect error (${this.reconnectAttempts}/${this.maxReconnectAttempts}):`, error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed after max attempts');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 Socket disconnected manually');
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
      console.log(`📤 Emitted: ${event}`, data);
    } else {
      console.warn(`⚠️ Cannot emit ${event}: Socket not connected`);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.removeAllListeners(event);
      }
    }
  }

  // Convenience methods
  joinConversation(conversationId) {
    this.emit('conversation:join', conversationId);
  }

  sendMessage(messageData) {
    this.emit('message:send', messageData);
  }

  startTyping(conversationId) {
    this.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId) {
    this.emit('typing:stop', { conversationId });
  }

  markAsRead(messageIds, conversationId) {
    this.emit('message:read', { messageIds, conversationId });
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

export default new SocketService();
