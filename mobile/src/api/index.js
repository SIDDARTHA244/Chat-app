import axios from "axios";
import { Platform } from "react-native";  // 👈 you forgot this import

const API = axios.create({
  baseURL: (() => {
    if (__DEV__) {
      // Android Emulator
      if (Platform.OS === "android") return "http://10.0.2.2:5000";
      // iOS Simulator
      if (Platform.OS === "ios") return "http://localhost:5000";
      // Real Device (same WiFi as your PC)
      return "http://192.168.1.101:5000"; // 👈 replace with your LAN IP
    }
    // Production (deploy your backend here later)
    return "https://your-production-api.com";
  })(),
});

export default API;
