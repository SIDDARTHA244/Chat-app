import { io } from "socket.io-client";

// ⚠️ FIXED: Use the same IP as in auth.js for consistency
const SOCKET_URL = "http://192.168.1.101:5000"; // ✅ Changed from 10.0.2.2 to match your IP

const socket = io(SOCKET_URL, {
  transports: ["websocket"], // force websocket, avoid polling issues
});

export default socket;
