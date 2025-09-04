import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ⚠️ Set correct backend URL depending on environment
// - Android Emulator: http://10.0.2.2:5000
// - iOS Simulator: http://localhost:5000
// - Real Device (Expo Go): replace with your PC LAN IP, e.g. http://192.168.1.101:5000
const API_URL = "http://192.168.1.101:5000"; // <-- change this to your actual LAN IP

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Register user
export const register = async (data) => {
  try {
    const res = await api.post("/auth/register", data);
    return res.data;
  } catch (err) {
    console.error("Register error:", err.response?.data || err.message);
    throw err;
  }
};

// Login user + save token in AsyncStorage
export const login = async (data) => {
  try {
    const res = await api.post("/auth/login", data);

    if (res.data.token) {
      await AsyncStorage.setItem("token", res.data.token);

      // Attach token for all future requests
      api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
    }

    return res.data; // contains { token, user }
  } catch (err) {
    console.error("Login error:", err.response?.data || err.message);
    throw err;
  }
};

// Load token on app startup
export const setupAuth = async () => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
};

export default api;
