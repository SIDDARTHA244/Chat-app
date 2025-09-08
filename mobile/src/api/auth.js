import api from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Register new user
export const register = async (userData) => {
  try {
    console.log('Registering user:', userData.name, userData.email);

    const response = await api.post('/auth/register', {
      name: userData.name,
      email: userData.email,
      password: userData.password,
    });

    if (response.data.success && response.data.token) {
      // Store token and user info in AsyncStorage
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('✅ Registration successful');
    }

    return response.data;
  } catch (error) {
    console.error('Registration error:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    if (error.message === 'Network Error') {
      throw new Error(
        'Cannot connect to server. Please check your network and ensure the server is running.'
      );
    }

    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid registration data');
    }

    if (error.response?.status === 409) {
      throw new Error('User already exists with this email');
    }

    throw error;
  }
};

// Login user
export const login = async (credentials) => {
  try {
    console.log('Logging in user:', credentials.email);

    const response = await api.post('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });

    if (response.data.success && response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('✅ Login successful');
    }

    return response.data;
  } catch (error) {
    console.error('Login error:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    if (error.message === 'Network Error') {
      throw new Error(
        'Cannot connect to server. Please check your network and ensure the server is running.'
      );
    }

    if (error.response?.status === 401) {
      throw new Error('Invalid email or password');
    }

    if (error.response?.status === 404) {
      throw new Error('User not found');
    }

    throw error;
  }
};

// Logout user
export const logout = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    console.log('✅ Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Get current token
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Get current user data
export const getUser = async () => {
  try {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};
