import { useState, useContext } from "react";
import { scheduleNotification } from "../utils/notification";
import { DarkModeContext } from "../context/darkModeContext";

import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  Alert,
  Modal,
  Pressable,
  Switch,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function EditTaskForm({ route, navigation }) {
  const { darkMode, toggleDarkMode } = useContext(DarkModeContext);
  const { task, index } = route.params;
  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState(new Date(task.dueDate));
  const [notify, setNotify] = useState(task.notify || false);
  const [importance, setImportance] = useState(task.importance || "medium");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);


  const styles = StyleSheet.create(getStyles(darkMode));
  
  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Task title is required.");
      return;
    }
    setModalVisible(true);
  };

  const confirmSave = async () => {
    try {
      const updatedTask = {
        ...task,
        title,
        description,
        dueDate,
        notify,
        importance,
      };

      const existing = await AsyncStorage.getItem("tasks");
      const tasks = existing ? JSON.parse(existing) : [];

      tasks[index] = updatedTask;
      await AsyncStorage.setItem("tasks", JSON.stringify(tasks));

      // 🔔 Schedule notification if notify is true
      if (updatedTask.notify) {
        const taskKey = updatedTask.title + updatedTask.dueDate;
        scheduleNotification(updatedTask, taskKey);
      }

      Alert.alert("Task Updated", "✅ Task updated successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);

      setModalVisible(false);
    } catch (err) {
      console.error("Error updating task:", err);
      Alert.alert("Error", "Something went wrong while saving the task.");
    }
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
      <Text style={styles.header}>Edit Task</Text>

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
        <Button title="Update Task" onPress={handleSubmit} />
      </View>

      {/* Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>
              Are you sure you want to update this task?
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
