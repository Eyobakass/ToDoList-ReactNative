import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import StackNavigator from "./navigation/stackNavigator";
import { navigationRef } from "./navigation/navigationRef";
import { DarkModeProvider } from "./context/darkModeContext";
import "./components/geofenceTask";
import * as Location from "expo-location"; // <-- Make sure this is imported
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    Location.hasStartedGeofencingAsync("TASK_GEOFENCE").then((started) => {
      if (!started) {
        Location.startGeofencingAsync("TASK_GEOFENCE", []);
      }
    });
  }, []);

  return (
    <DarkModeProvider>
      <NavigationContainer ref={navigationRef}>
        <StackNavigator />
      </NavigationContainer>
    </DarkModeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
});
