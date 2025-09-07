import api from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const register = async (name, email, password) => {
  try {
    const response = await api.post('/auth/register', {
      name: name.trim(),
      email: email.trim().toLowerCase(), 
      password
    });
    
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password
    });
    
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.multiRemove(['token', 'user']);
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const getCurrentUser = async () => {
  try {
    const userString = await AsyncStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('Get token error:', error);
    return null;
  }
};
