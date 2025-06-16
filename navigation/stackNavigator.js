import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "../components/home";
import AddTaskForm from "../components/addTaskForm";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import EditTaskForm from "../components/editTaskForm";
import { DarkModeContext } from "../context/DarkModeContext";

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  const { darkMode } = useContext(DarkModeContext);

  const headerStyle = {
    backgroundColor: darkMode ? "#1e1e1e" : "#ffffff",
  };
  const headerTitleStyle = {
    color: darkMode ? "#ffffff" : "#000000",
  };

  return (
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
  );
}
