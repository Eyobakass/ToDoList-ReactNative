import React, { useContext, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "../components/home";
import AddTaskForm from "../components/addTaskForm";
import { StatusBar } from "expo-status-bar";
import EditTaskForm from "../components/editTaskForm";
import { DarkModeContext } from "../context/darkModeContext";
import * as NavigationBar from "expo-navigation-bar"; // <== NEW IMPORT

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  const { darkMode } = useContext(DarkModeContext);

  useEffect(() => {
    // Ensure system nav bar is visible and styled
    NavigationBar.setVisibilityAsync("visible");
    NavigationBar.setBackgroundColorAsync(darkMode ? "#1e1e1e" : "#ffffff");
    NavigationBar.setButtonStyleAsync(darkMode ? "light" : "dark");
  }, [darkMode]);

  const headerStyle = {
    backgroundColor: darkMode ? "#1e1e1e" : "#ffffff",
  };
  const headerTitleStyle = {
    color: darkMode ? "#ffffff" : "#000000",
  };

  return (
    <>
      <StatusBar
        style={darkMode ? "light" : "dark"}
        translucent={false}
        backgroundColor={darkMode ? "#1e1e1e" : "#ffffff"}
      />
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={Home}
          options={{
            headerStyle,
            headerTitleStyle,
            headerTitleAlign: "left",
          }}
        />
        <Stack.Screen
          name="AddTaskForm"
          component={AddTaskForm}
          options={{
            headerStyle,
            headerTitleStyle,
          }}
        />
        <Stack.Screen
          name="EditTaskForm"
          component={EditTaskForm}
          options={{
            headerStyle,
            headerTitleStyle,
          }}
        />
      </Stack.Navigator>
    </>
  );
}
