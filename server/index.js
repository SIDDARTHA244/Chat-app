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
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// -------------------- MongoDB Connection --------------------
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/chatapp";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    console.log("📊 Database:", mongoose.connection.name);
  })
  .catch((err) => {
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
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    server: "Chat App Server v1.0",
  });
});

app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/users"));
app.use("/conversations", require("./routes/conversations"));
app.use("/messages", require("./routes/messages"));

// -------------------- Socket.io --------------------
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true,
  transports: ["websocket", "polling"],
});

// Track online users
const onlineUsers = new Map();

// Middleware: authenticate sockets with JWT
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

// Socket events
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id, "UserId:", socket.userId);

  // Add user to online list
  onlineUsers.set(socket.userId, socket.id);
  socket.broadcast.emit("user:online", socket.userId);

  // Join personal room
  socket.join(socket.userId);

  // Send current online users
  socket.emit("users:online", Array.from(onlineUsers.keys()));

  // Join conversation room
  socket.on("conversation:join", (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.userId} joined conversation ${conversationId}`);
  });

  // Send message
  socket.on("message:send", async (data) => {
    try {
      console.log("📨 Message received:", data);

      const messageData = {
        text: data.text,
        sender: socket.userId,
        conversationId: data.conversationId,
        recipientId: data.to,
        timestamp: new Date(),
        messageType: data.messageType || "text",
        fileUrl: data.fileUrl || null,
      };

      const newMessage = new Message(messageData);
      await newMessage.save();
      await newMessage.populate("sender", "name email avatar");

      io.to(data.conversationId).emit("message:new", newMessage);

      io.to(data.to).emit("message:notification", {
        ...newMessage.toObject(),
        senderName: newMessage.sender.name,
      });

      socket.emit("message:sent", {
        success: true,
        message: newMessage,
        tempId: data.tempId,
      });
    } catch (error) {
      console.error("❌ Message send error:", error);
      socket.emit("message:error", {
        error: error.message,
        tempId: data.tempId,
      });
    }
  });

  // Typing indicators
  socket.on("typing:start", (data) => {
    socket.to(data.conversationId).emit("typing:start", {
      userId: socket.userId,
      conversationId: data.conversationId,
    });
  });

  socket.on("typing:stop", (data) => {
    socket.to(data.conversationId).emit("typing:stop", {
      userId: socket.userId,
      conversationId: data.conversationId,
    });
  });

  // Read receipts
  socket.on("message:read", async (data) => {
    try {
      await Message.updateMany(
        {
          _id: { $in: data.messageIds },
          "readBy.user": { $ne: socket.userId },
        },
        {
          $push: {
            readBy: { user: socket.userId, readAt: new Date() },
          },
        }
      );

      io.to(data.conversationId).emit("message:read", {
        messageIds: data.messageIds,
        readBy: socket.userId,
      });
    } catch (error) {
      console.error("❌ Mark as read error:", error);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id, "UserId:", socket.userId);
    onlineUsers.delete(socket.userId);
    socket.broadcast.emit("user:offline", socket.userId);
  });

  // Socket error
  socket.on("error", (error) => {
    console.error("🔥 Socket error:", error);
  });
});

// -------------------- Error Handling --------------------
app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0"; // ✅ ensures server listens on all interfaces

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📱 Mobile app should connect to: http://192.168.1.100:${PORT}`);
  console.log(`🌐 Health check: http://192.168.1.100:${PORT}/health`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

module.exports = { app, server, io };
