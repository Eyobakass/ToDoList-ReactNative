import { useState, useContext } from "react";
import { scheduleNotification } from "../utils/notification";
import { DarkModeContext } from "../context/darkModeContext";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  Switch,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import MapView,{marker} from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
export default function AddTaskForm() {
  const{darkMode,toggleDarkMode} = useContext(DarkModeContext);
  const styles = StyleSheet.create(getStyles(darkMode));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [notify, setNotify] = useState(false);
  const [importance, setImportance] = useState("medium"); // "high" | "medium" | "low"

  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: 9.03, // default (Addis Ababa)
    longitude: 38.74,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  

  const addTask = async (newTask) => {
    try {
      console.log("NEW TASK:", newTask);

      if (!newTask.title || !newTask.dueDate) {
        console.warn("Missing title or dueDate in newTask");
        return;
      }

      const newDateOnly = newTask.dueDate.toISOString().split("T")[0]; // ✅ convert to string first

      const existing = await AsyncStorage.getItem("tasks");
      const tasks = existing ? JSON.parse(existing) : [];

      const isDuplicate = tasks.some((task) => {
        const taskDateOnly = new Date(task.dueDate).toISOString().split("T")[0]; // ✅ convert each to date then string
        return task.title === newTask.title && taskDateOnly === newDateOnly;
      });

      if (isDuplicate) {
        console.log("Duplicate task detected — same title and same day.");
        Alert.alert(
          "Duplicate Task",
          "A task with the same title and due date already exists.",
          [{ text: "OK" }]
        );
        return;
      }

      tasks.push(newTask);
      await AsyncStorage.setItem("tasks", JSON.stringify(tasks));
      Alert.alert("Task Saved", "✅ Task saved", [
        { text: "OK" },
      ]);
      console.log("✅ Task saved to local storage");
      console.log("📋 Current tasks:", tasks);
    } catch (error) {
      console.error("❌ Error saving task:", error);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Task title is required.");
      return;
    }

    setModalVisible(true); // Show custom confirmation
  };

  const confirmSave = () => {
    const newTask = {
      title,
      description,
      dueDate,
      notify,
      importance,
      location,
      done: false,
    };

    if (typeof addTask === "function") {
      addTask(newTask); // pass it to the parent if needed
    }

    // Schedule notification if applicable
    if (newTask.notify) {
      const taskKey = newTask.title + newTask.dueDate; // or use an ID if available
      scheduleNotification(newTask, taskKey);
    }
    
    setModalVisible(false);
    setTitle("");
    setDescription("");
    setDueDate(new Date());
    setNotify(false);
    setImportance("medium");
  };

  const renderImportanceOption = (level) => {
    const isSelected = importance === level.toLowerCase();
    return (
      <Pressable
        key={level}
        style={[
          styles.importanceButton,
          isSelected && styles[`importance${level}`],
        ]}
        onPress={() => setImportance(level.toLowerCase())}
      >
        <Text style={styles.importanceText}>{level}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Add Task</Text>

      <Text style={styles.label}>Task Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter task title"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Optional description"
        multiline
      />

      <Text style={styles.label}>Select the due date</Text>
      <Button
        title={dueDate.toDateString()}
        onPress={() => setShowDatePicker(true)}
      />
      {showDatePicker && (
        <DateTimePicker
          value={dueDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDueDate(new Date(selectedDate));
          }}
        />
      )}

      <View style={styles.timeNotifyRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Select time</Text>
          <Button
            title={dueDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            onPress={() => setShowTimePicker(true)}
          />
          {showTimePicker && (
            <DateTimePicker
              value={dueDate}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) {
                  const newDate = new Date(dueDate);
                  newDate.setHours(selectedTime.getHours());
                  newDate.setMinutes(selectedTime.getMinutes());
                  setDueDate(newDate);
                }
              }}
            />
          )}
        </View>
        <View style={styles.notifyContainer}>
          <Text style={styles.label}>Get Notified</Text>
          <Switch value={notify} onValueChange={setNotify} />
        </View>
      </View>

      <Text style={styles.label}>Importance</Text>
      <View style={styles.importanceContainer}>
        {["High", "Medium", "Low"].map(renderImportanceOption)}
      </View>

      <View style={{ marginTop: 20 }}>
        <Button title="Save Task" onPress={handleSubmit} />
      </View>

      {/* Custom confirmation modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>
              Are you sure you want to save this task?
            </Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.button} onPress={confirmSave}>
                <Text style={styles.buttonText}>Yes</Text>
              </Pressable>
              <Pressable
                style={[styles.button, { backgroundColor: "#aaa" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>No</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <View style={{ height: 200, marginVertical: 10 }}>
        <MapView
          style={{ flex: 1 }}
          region={region}
          onPress={(e) => setLocation(e.nativeEvent.coordinate)}
        >
          {location && (
            <Marker
              coordinate={location}
              draggable
              onDragEnd={(e) => setLocation(e.nativeEvent.coordinate)}
            />
          )}
        </MapView>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (darkMode) =>
  StyleSheet.create({
    container: {
      padding: 20,
      paddingTop: 50,
      flex: 1,
      backgroundColor: darkMode ? "#121212" : "#fff",
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
      color: darkMode ? "#ffffff" : "#000000",
    },
    label: {
      marginTop: 10,
      fontSize: 16,
      color: darkMode ? "#dddddd" : "#000000",
    },
    input: {
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 6,
      padding: 10,
      marginTop: 5,
      backgroundColor: darkMode ? "#1e1e1e" : "#ffffff",
      color: darkMode ? "#ffffff" : "#000000",
    },
    timeNotifyRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    notifyContainer: {
      alignItems: "center",
    },
    importanceContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 10,
    },
    importanceButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 20,
      backgroundColor: darkMode ? "#2a2a2a" : "#f0f0f0",
    },
    importanceHigh: {
      backgroundColor: "#ff6b6b",
      borderColor: "#ff6b6b",
    },
    importanceMedium: {
      backgroundColor: "#ffa500",
      borderColor: "#ffa500",
    },
    importanceLow: {
      backgroundColor: "#48c774",
      borderColor: "#48c774",
    },
    importanceText: {
      color: darkMode ? "#ffffff" : "#000000",
      fontWeight: "bold",
      textTransform: "capitalize",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      width: "80%",
      backgroundColor: darkMode ? "#1e1e1e" : "#fff",
      padding: 20,
      borderRadius: 8,
      elevation: 10,
    },
    modalText: {
      fontSize: 16,
      marginBottom: 20,
      textAlign: "center",
      color: darkMode ? "#ffffff" : "#000000",
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    button: {
      padding: 10,
      backgroundColor: "#1E90FF",
      borderRadius: 6,
      minWidth: 80,
      alignItems: "center",
    },
    buttonText: {
      color: "#fff",
      fontWeight: "600",
    },
  });
