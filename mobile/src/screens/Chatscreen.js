import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Button,
  FlatList,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import API from "../api";
import socket from "../utils/socket";

export default function ChatScreen({ route }) {
  const { user, partner } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const res = await API.get(
          `/conversations/${partner._id}/messages?userId=${user._id}`
        );
        setMessages(res.data);
      } catch (err) {
        console.log("Error fetching messages:", err.message);
      }
    };

    fetchMessages();

    // Join socket room
    socket.emit("join", user._id);

    // Listen for new messages
    const handleNewMessage = (msg) => {
      if (msg.sender === partner._id || msg.receiver === partner._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("message:new", handleNewMessage);

    // Cleanup on unmount
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, []);

  const sendMessage = () => {
    if (!text.trim()) return; // prevent empty messages
    socket.emit("message:send", {
      sender: user._id,
      receiver: partner._id,
      text,
    });
    setText("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Messages List */}
      <FlatList
        data={messages}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.message,
              item.sender === user._id
                ? styles.myMessage
                : styles.theirMessage,
            ]}
          >
            <Text style={styles.messageText}>
              {item.sender === user._id ? "Me" : partner.username}: {item.text}
            </Text>
          </View>
        )}
      />

      {/* Input + Send */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  message: {
    margin: 8,
    padding: 10,
    borderRadius: 8,
    maxWidth: "75%",
  },
  myMessage: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
  },
  theirMessage: {
    backgroundColor: "#EEE",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
  },
  inputRow: {
    flexDirection: "row",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 8,
  },
});
