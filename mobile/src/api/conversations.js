import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://localhost:5000";

export const getMessages = async (conversationId) => {
  const token = await AsyncStorage.getItem("token");
  return axios.get(`${API_URL}/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
