import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "../components/home";
import AddTaskForm from "../components/addTaskForm";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import EditTaskForm from "../components/editTaskForm";

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={Home}
        options={{
          headerStyle: {
            paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          },
          headerTitleAlign: "left",
        }}
      />
      <Stack.Screen
        name="AddTaskForm"
        component={AddTaskForm}
        options={{
          headerStyle: {
            paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          },
        }}
      />
      <Stack.Screen
        name="EditTaskForm"
        component={EditTaskForm}
        options={{
          headerStyle: {
            paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          },
        }}
      />
    </Stack.Navigator>
  );
}
