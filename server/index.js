const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// -------------------- Middleware --------------------
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// -------------------- MongoDB Connection --------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// -------------------- Models --------------------
const User = require("./models/User");
const Message = require("./models/Message");
const Conversation = require("./models/Conversation");

// -------------------- Routes --------------------
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    server: "Chat App Server v1.0"
  });
});

app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/users"));
app.use("/conversations", require("./routes/conversations"));
app.use("/messages", require("./routes/messages"));

// -------------------- Socket.io --------------------
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true,
  transports: ["websocket", "polling"]
});

const onlineUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id, "UserId:", socket.userId);
  onlineUsers.set(socket.userId, socket.id);
  socket.broadcast.emit("user:online", socket.userId);

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id, "UserId:", socket.userId);
    onlineUsers.delete(socket.userId);
    socket.broadcast.emit("user:offline", socket.userId);
  });
});

// -------------------- Error Handling --------------------
app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📱 Mobile app should connect to: http://${process.env.SERVER_IP}:${PORT}`);
  console.log(`🌐 Health check: http://${process.env.SERVER_IP}:${PORT}/health`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

module.exports = { app, server, io };
