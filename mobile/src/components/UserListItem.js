import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

const UserListItem = ({ user, onPress }) => {
  return (
    <TouchableOpacity style={styles.item} onPress={() => onPress(user)}>
      <Text style={styles.text}>{user.username}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  text: {
    fontSize: 16,
  },
});

export default UserListItem;
