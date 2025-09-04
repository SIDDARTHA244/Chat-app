// server/socket/socket.js
function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("✅ New client connected:", socket.id);

    socket.on("sendMessage", (data) => {
      console.log("📩 Message received:", data);
      // Broadcast to other clients
      socket.broadcast.emit("receiveMessage", data);
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
}

module.exports = registerSocketHandlers;
