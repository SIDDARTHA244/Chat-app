const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const convRoutes = require("./routes/conversations");

// Import socket handlers
const registerSocketHandlers = require("./socket/socket");

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/conversations", convRoutes);

// Connect DB
connectDB();

// Server + Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Register socket handlers
registerSocketHandlers(io);

const PORT = process.env.PORT || 5000;
const HOST = "192.168.1.101"; // 👈 your PC’s LAN IP

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
});
