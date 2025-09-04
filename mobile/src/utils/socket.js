import { io } from "socket.io-client";

// ⚠️ Use the same IP as in auth.js
const SOCKET_URL = "http://10.0.2.2:5000";

const socket = io(SOCKET_URL, {
  transports: ["websocket"], // force websocket, avoid polling issues
});

export default socket;
