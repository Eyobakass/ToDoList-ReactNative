import {
  StyleSheet,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import StackNavigator from "./navigation/stackNavigator";
import { navigationRef } from "./navigation/navigationRef";
import { DarkModeProvider } from "./utils/darkModeContext";
export default function App() {
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
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
