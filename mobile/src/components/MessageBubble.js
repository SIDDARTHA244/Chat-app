import React from "react";
import { View, Text, StyleSheet } from "react-native";

const MessageBubble = ({ message, isOwn }) => {
  return (
    <View style={[styles.container, isOwn ? styles.own : styles.other]}>
      <Text style={styles.text}>{message.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    maxWidth: "70%",
  },
  own: {
    backgroundColor: "#0078fe",
    alignSelf: "flex-end",
  },
  other: {
    backgroundColor: "#e5e5ea",
    alignSelf: "flex-start",
  },
  text: {
    color: "#fff",
  },
});

export default MessageBubble;
