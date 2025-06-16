import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const DarkModeContext = createContext();

export const DarkModeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("darkMode");
      setDarkMode(stored === "true");
    })();
  }, []);

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    await AsyncStorage.setItem("darkMode", JSON.stringify(newMode));
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};
