import axios from 'axios';

// IMPORTANT: Make sure this IP matches your server's actual IP
// Run 'ipconfig' on Windows to check
const API_BASE_URL = 'http://192.168.1.103:5000'; // 👈 corrected IP from server logs

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.message);

    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      console.log('Network error detected. Please check:');
      console.log('1. Server is running on', API_BASE_URL);
      console.log('2. Your device and computer are on the same WiFi network');
      console.log('3. Windows Firewall is not blocking port 5000');
      console.log('4. IP address in mobile app matches your computer IP');
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
