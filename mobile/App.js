import { registerRootComponent } from "expo";
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import your screens
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import RegisterScreen from "./src/screens/Registerscreen";
import ChatScreen from "./src/screens/Chatscreen"; // ✅ match filename exactly

const Stack = createNativeStackNavigator();

function App() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        setIsLoggedIn(!!token);
      } catch (err) {
        console.log("Error checking login", err);
      } finally {
        setLoading(false);
      }
    };
    checkLogin();
  }, []);

  if (loading) {
    return null; // or show a splash/loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: "Register" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

registerRootComponent(App);

export default App;
