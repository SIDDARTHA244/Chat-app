import React, { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import { register } from "../api/auth";

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await register({ username, email, password });
      Alert.alert("Success", "Registration successful!");
      navigation.replace("Login");
    } catch (err) {
      Alert.alert("Error", err.response?.data?.msg || "Registration failed");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput placeholder="Username" value={username} onChangeText={setUsername} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Register" onPress={handleRegister} />
    </View>
  );
};

export default RegisterScreen;
