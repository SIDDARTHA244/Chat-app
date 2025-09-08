import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Change this IP address to match your computer's actual IP
// This should be the same IP as your server is running on
const SOCKET_URL = 'http://192.168.1.100:5000'; // Updated to match server IP

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  // Initialize socket connection
  connect = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        console.error('No token found for socket connection');
        return;
      }

      console.log('Connecting to socket server:', SOCKET_URL);

      this.socket = io(SOCKET_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'], // Allow both transports
        timeout: 10000, // 10 seconds timeout
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5
      });

      // Connection successful
      this.socket.on('connect', () => {
        console.log('Socket connected successfully:', this.socket.id);
        this.isConnected = true;
      });

      // Connection error
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        this.isConnected = false;

        if (error.message.includes('timeout')) {
          console.log('Connection timed out. Please check:');
          console.log('1. Server is running on', SOCKET_URL);
          console.log('2. Your device and computer are on the same network');
          console.log('3. Firewall is not blocking the connection');
        }
      });

      // Disconnection
      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        this.isConnected = false;
      });

      // Reconnection attempt
      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Socket reconnection attempt:', attemptNumber);
      });

      // Reconnection successful
      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        this.isConnected = true;
      });

      // Reconnection failed
      this.socket.on('reconnect_failed', () => {
        console.error('Socket reconnection failed');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Error connecting to socket:', error);
    }
  };

  // Disconnect socket
  disconnect = () => {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  };

  // Join user room
  joinRoom = (userId) => {
    if (this.socket && this.isConnected) {
      console.log('Joining room for user:', userId);
      this.socket.emit('join', userId);
    } else {
      console.error('Socket not connected, cannot join room');
    }
  };

  // Send message
  sendMessage = (messageData) => {
    if (this.socket && this.isConnected) {
      console.log('Sending message:', messageData);
      this.socket.emit('message:send', messageData);
    } else {
      console.error('Socket not connected, cannot send message');
    }
  };

  // Listen for new messages
  onNewMessage = (callback) => {
    if (this.socket) {
      this.socket.on('message:new', callback);
    }
  };

  // Start typing indicator
  startTyping = (conversationId) => {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing:start', { conversationId });
    }
  };

  // Stop typing indicator
  stopTyping = (conversationId) => {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing:stop', { conversationId });
    }
  };

  // Listen for typing indicators
  onTyping = (callback) => {
    if (this.socket) {
      this.socket.on('typing:start', callback);
    }
  };

  onStopTyping = (callback) => {
    if (this.socket) {
      this.socket.on('typing:stop', callback);
    }
  };

  // Mark message as read
  markAsRead = (messageId) => {
    if (this.socket && this.isConnected) {
      this.socket.emit('message:read', { messageId });
    }
  };

  // Listen for user online/offline status  
  onUserOnline = (callback) => {
    if (this.socket) {
      this.socket.on('user:online', callback);
    }
  };

  onUserOffline = (callback) => {
    if (this.socket) {
      this.socket.on('user:offline', callback);
    }
  };

  // Remove all listeners
  removeAllListeners = () => {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  };

  // Get connection status
  isSocketConnected = () => {
    return this.socket && this.isConnected;
  };
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
