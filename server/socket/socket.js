// server/socket/socket.js
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const connectedUsers = new Map(); // Track connected users

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("✅ New client connected:", socket.id);

    // User joins their personal room
    socket.on("join", async (userId) => {
      try {
        socket.userId = userId;
        socket.join(userId);
        connectedUsers.set(userId, socket.id);
        
        // Update user online status
        await User.findByIdAndUpdate(userId, { 
          online: true,
          lastSeen: new Date()
        });
        
        // Notify others that user is online
        socket.broadcast.emit("user:online", userId);
        
        console.log(`👤 User ${userId} joined their room`);
      } catch (err) {
        console.error("Join error:", err);
      }
    });

    // Handle sending messages
    socket.on("message:send", async (data) => {
      try {
        const { sender, receiver, text } = data;
        
        // Find or create conversation
        let conversation = await Conversation.findOne({
          participants: { $all: [sender, receiver], $size: 2 }
        });
        
        if (!conversation) {
          conversation = new Conversation({
            participants: [sender, receiver]
          });
          await conversation.save();
        }

        // Create message
        const message = new Message({
          conversation: conversation._id,
          sender: sender,
          content: text,
          type: 'text',
          status: 'sent'
        });
        
        await message.save();
        
        // Update conversation's last message
        await Conversation.findByIdAndUpdate(conversation._id, {
          lastMessage: message._id,
          updatedAt: new Date()
        });

        // Populate sender info
        await message.populate('sender', 'name username avatar');
        
        // Create response object matching frontend expectations
        const messageData = {
          _id: message._id,
          text: message.content,
          sender: message.sender._id,
          receiver: receiver,
          timestamp: message.createdAt,
          status: 'delivered'
        };

        // Send to receiver if online
        if (connectedUsers.has(receiver)) {
          io.to(receiver).emit("message:new", messageData);
        }
        
        // Send confirmation back to sender
        socket.emit("message:sent", messageData);
        
        console.log(`📩 Message sent from ${sender} to ${receiver}`);
      } catch (err) {
        console.error("Send message error:", err);
        socket.emit("message:error", { error: "Failed to send message" });
      }
    });

    // Handle typing indicators
    socket.on("typing:start", (data) => {
      const { userId, partnerId } = data;
      if (connectedUsers.has(partnerId)) {
        io.to(partnerId).emit("typing:start", { userId });
      }
    });

    socket.on("typing:stop", (data) => {
      const { userId, partnerId } = data;
      if (connectedUsers.has(partnerId)) {
        io.to(partnerId).emit("typing:stop", { userId });
      }
    });

    // Handle message read receipts
    socket.on("message:read", async (data) => {
      try {
        const { messageIds, userId } = data;
        
        // Update message status to read
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { status: 'read' } }
        );
        
        // Notify sender that messages were read
        messageIds.forEach(msgId => {
          socket.broadcast.emit("message:read", { messageId: msgId, readBy: userId });
        });
        
      } catch (err) {
        console.error("Mark as read error:", err);
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      try {
        if (socket.userId) {
          connectedUsers.delete(socket.userId);
          
          // Update user offline status
          await User.findByIdAndUpdate(socket.userId, { 
            online: false,
            lastSeen: new Date()
          });
          
          // Notify others that user is offline
          socket.broadcast.emit("user:offline", socket.userId);
          
          console.log(`❌ User ${socket.userId} disconnected`);
        }
      } catch (err) {
        console.error("Disconnect error:", err);
      }
    });

    // Legacy support for existing frontend
    socket.on("sendMessage", (data) => {
      console.log("📩 Legacy message received:", data);
      socket.broadcast.emit("receiveMessage", data);
    });
  });
}

module.exports = registerSocketHandlers;