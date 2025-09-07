import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🚨 YOUR SPECIFIC IP ADDRESS
const API_BASE_URL = 'http://192.168.1.100:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Token retrieval error:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // You might want to navigate to login screen here
    }
    
    return Promise.reject({
      message: error.response?.data?.error || error.message || 'Network error',
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

export default api;
export { API_BASE_URL };
