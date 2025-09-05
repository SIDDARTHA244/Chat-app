import React, { useEffect, useState, useRef } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import API from "../api";
import socket from "../utils/socket";

export default function ChatScreen({ route, navigation }) {
  const { user, partner } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef();
  const typingTimeout = useRef();

  useEffect(() => {
    navigation.setOptions({
      title: partner.name || partner.username,
    });

    // Fetch existing messages
    fetchMessages();

    // Join socket room
    socket.emit("join", user._id);

    // Socket listeners
    const handleNewMessage = (msg) => {
      if ((msg.sender === partner._id && msg.receiver === user._id) || 
          (msg.sender === user._id && msg.receiver === partner._id)) {
        setMessages((prev) => [...prev, msg]);
        
        // Mark message as delivered if we're the receiver
        if (msg.receiver === user._id) {
          socket.emit("message:read", { messageIds: [msg._id], userId: user._id });
        }
      }
    };

    const handleTypingStart = (data) => {
      if (data.userId === partner._id) {
        setPartnerTyping(true);
      }
    };

    const handleTypingStop = (data) => {
      if (data.userId === partner._id) {
        setPartnerTyping(false);
      }
    };

    const handleMessageRead = (data) => {
      if (data.readBy === partner._id) {
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId 
            ? { ...msg, status: 'read' } 
            : msg
        ));
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("message:read", handleMessageRead);

    // Cleanup
    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("message:read", handleMessageRead);
      
      // Stop typing if component unmounts
      if (isTyping) {
        socket.emit("typing:stop", { userId: user._id, partnerId: partner._id });
      }
    };
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      // This endpoint needs to be fixed to work with user pairs
      const res = await API.get(`/conversations/${partner._id}/messages?userId=${user._id}`);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
      // For now, start with empty messages if API fails
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    const messageText = text.trim();
    if (!messageText) return;

    // Stop typing indicator
    if (isTyping) {
      socket.emit("typing:stop", { userId: user._id, partnerId: partner._id });
      setIsTyping(false);
    }

    // Send message via socket
    socket.emit("message:send", {
      sender: user._id,
      receiver: partner._id,
      text: messageText,
    });

    // Add message to UI immediately (optimistic update)
    const tempMessage = {
      _id: Date.now().toString(), // Temporary ID
      text: messageText,
      sender: user._id,
      receiver: partner._id,
      timestamp: new Date(),
      status: 'sent'
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setText("");
  };

  const handleTextChange = (newText) => {
    setText(newText);
    
    if (newText.length > 0 && !isTyping) {
      setIsTyping(true);
      socket.emit("typing:start", { userId: user._id, partnerId: partner._id });
    }
    
    // Clear previous timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    // Set timeout to stop typing after 2 seconds of no input
    typingTimeout.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket.emit("typing:stop", { userId: user._id, partnerId: partner._id });
      }
    }, 2000);
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender === user._id;
    const messageTime = new Date(item.timestamp || item.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View style={[
        styles.message,
        isMyMessage ? styles.myMessage : styles.theirMessage
      ]}>
        <Text style={styles.messageText}>{item.text || item.content}</Text>
        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>{messageTime}</Text>
          {isMyMessage && (
            <Text style={styles.messageStatus}>
              {item.status === 'read' ? '✓✓' : item.status === 'delivered' ? '✓' : '⏳'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id || item.timestamp?.toString()}
        renderItem={renderMessage}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
        style={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation!</Text>
          </View>
        }
      />

      {/* Typing Indicator */}
      {partnerTyping && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>
            {partner.name || partner.username} is typing...
          </Text>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!text.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  message: {
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
    maxWidth: "80%",
  },
  myMessage: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  messageText: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  messageTime: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  messageStatus: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginLeft: 8,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  typingText: {
    fontStyle: "italic",
    color: "#666",
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
  },
});

// Update their message text color
StyleSheet.flatten([
  styles.theirMessage,
  {
    color: "#333",
  }
]);