import axios from "axios";
import { Platform } from "react-native";

const API = axios.create({
  baseURL: (() => {
    if (__DEV__) {
      // For real devices, always use your computer's LAN IP
      return "http://192.168.1.101:5000";
      
      // NOTE: Only use these if testing in simulators/emulators:
      // Android Emulator: "http://10.0.2.2:5000"
      // iOS Simulator: "http://localhost:5000"
    }
    // Production
    return "https://your-production-api.com";
  })(),
});

export default API;
