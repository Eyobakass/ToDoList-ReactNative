// Home.js
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Switch,
  Alert,
  Pressable,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import moment from "moment";
import CheckBox from "expo-checkbox";
import { navigationRef } from "../navigation/navigationRef";
import {
  requestNotificationPermission,
  syncTaskNotifications,
} from "../utils/notification";
import { DarkModeContext } from "../context/darkModeContext";

const categories = [
  "Today",
  "All",
  "Highly Important",
  "Mid-Important",
  "Less-Important",
  "Within A Week",
  "Next Week",
  "Within A Month",
  "Beyond A Month",
  "Completed Tasks",
];
export default function Home() {
  const { darkMode, toggleDarkMode } = useContext(DarkModeContext);

  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Today");
  const [activeWidget, setActiveWidget] = useState(null);

  const navigation = useNavigation();
  const styles = StyleSheet.create(getStyles(darkMode));

  useEffect(() => {
    loadTasks();
  }, []);
  useFocusEffect(
    useCallback(() => {
      const reload = async () => {
        await loadTasks();
      };
      reload();
    }, [])
  );

  useEffect(() => {
    filterTasks();
  }, [tasks, selectedCategory]);
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const saveTasks = async (updatedTasks) => {
    setTasks(updatedTasks);
    await AsyncStorage.setItem("tasks", JSON.stringify(updatedTasks));
    await syncTaskNotifications(updatedTasks); // 👈 sync notifications
  };

  const loadTasks = async () => {
    const stored = await AsyncStorage.getItem("tasks");
    if (stored) setTasks(JSON.parse(stored));
  };

  const filterTasks = () => {
    const now = new Date();
    const result = tasks.filter((task) => {
      if (selectedCategory === "All") return task.done === false;
      if (selectedCategory === "Highly Important")
        return task.importance === "high" && !task.done;
      if (selectedCategory === "Mid-Important")
        return task.importance === "medium" && !task.done;
      if (selectedCategory === "Less-Important")
        return task.importance === "low" && !task.done;
      if (selectedCategory === "Today")
        return moment(task.dueDate).isSame(now, "day") && !task.done;
      if (selectedCategory === "Within A Week")
        return moment(task.dueDate).diff(now, "days") <= 7 && !task.done;
      if (selectedCategory === "Within A Month")
        return moment(task.dueDate).diff(now, "days") <= 30 && !task.done;
      if (selectedCategory === "Beyond A Month")
        return moment(task.dueDate).diff(now, "days") > 30 && !task.done;
      if (selectedCategory === "Next Week")
        return (moment(task.dueDate).diff(now, "days") >= 7) && (moment(task.dueDate).diff(now,"days")<=14) && !task.done;
      if (selectedCategory === "Completed Tasks") return task.done === true;
      return false;
    });
    setFilteredTasks(result);
  };

  const handleNotifyToggle = (taskIndex) => {
    const updated = [...tasks];
    if (updated[taskIndex].done) {
      Alert.alert(
        "Cannot Toggle Notify",
        "You cannot toggle notify for completed tasks."
      );
      return;
    }
    updated[taskIndex].notify = !updated[taskIndex].notify;
    console.log("Notify toggled:", updated[taskIndex].notify);
    saveTasks(updated);
  };

  const handleCheckToggle = (taskIndex) => {
    const updated = [...tasks];
    updated[taskIndex].done = !updated[taskIndex].done;
    if (updated[taskIndex].notify) updated[taskIndex].notify = false;
    saveTasks(updated);
  };

  const deleteTask = (task) => {
    Alert.alert("Delete Task", "Are you sure?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: () => {
          const updated = tasks.filter(
            (t) =>
              !(
                t.title === task.title &&
                t.description === task.description &&
                t.dueDate === task.dueDate
              )
          );
          saveTasks(updated);
        },
        style: "destructive",
      },
    ]);
  };

  const renderTask = ({ item, index }) => {
    const bgColor =
      item.importance === "high"
        ? "#ff6b6b"
        : item.importance === "medium"
        ? "#ffa500"
        : item.importance === "low"
        ? "#48c774"
        : "lightblue";

    const isActive = activeWidget === index;

    return (
      <TouchableOpacity
        onPress={() => setActiveWidget(index === activeWidget ? null : index)}
        style={[styles.taskCard, { backgroundColor: bgColor }]}
      >
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <CheckBox
            value={item.done}
            onValueChange={() => {
              if (item.notify) {
                handleNotifyToggle(tasks.indexOf(item));
              }
              handleCheckToggle(tasks.indexOf(item));
            }}
          />
        </View>
        <Text style={styles.taskDesc}>{item.description}</Text>
        <Text style={styles.taskDue}>{moment(item.dueDate).calendar()}</Text>
        <View style={styles.taskActions}>
          <Text>Notify:</Text>
          <Switch
            value={item.notify}
            onValueChange={() => handleNotifyToggle(tasks.indexOf(item))}
          />
        </View>
        {isActive && (
          <View style={styles.actionButtons}>
            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                if (navigationRef.isReady() && !item.done) {
                  navigationRef.navigate("EditTaskForm", {
                    task: item,
                    index: tasks.indexOf(item),
                  });
                }
              }}
            >
              {item.done ? (
                <Text style={styles.actionText}>✅ Completed</Text>
              ) : (
                <Text style={styles.actionText}>📝 Edit</Text>
              )}
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: "#ff5252" }]}
              onPress={() => deleteTask(item)}
            >
              <Text style={styles.actionText}>🗑️ Delete</Text>
            </Pressable>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  const addTaskButtonHandler = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate("AddTaskForm");
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <Text style={{ marginBottom: 10, flexDirection: "row" }}>
        <Text style={styles.header}>Tasks</Text>
        <Switch value={darkMode} onValueChange={toggleDarkMode} style={{ right: 0 }} />
      </Text>
      <ScrollView
        horizontal
        style={styles.categoryScroll}
        contentContainerStyle={{
          alignItems: "center",
          height: 40,
          marginBottom: 0,
        }}
        showsHorizontalScrollIndicator={false}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.categoryBtn,
              selectedCategory === cat && styles.selectedCategory,
            ]}
          >
            <Text
              style={
                selectedCategory === cat
                  ? styles.selectedCategoryText
                  : styles.categoryText
              }
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(_, i) => i.toString()}
        style={styles.taskList}
      />
      <TouchableOpacity style={styles.addBtn} onPress={addTaskButtonHandler}>
        <Text style={styles.addText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const getStyles = (darkMode) => ({
  container: {
    paddingTop: 10,
    paddingHorizontal: 15,
    backgroundColor: darkMode ? "#121212" : "#f5f5f5",
    overflow: "hidden",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
    width: "100%",
    color: darkMode ? "#ffffff" : "#000000",
    
  },
  categoryScroll: {
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 0,
  },
  categoryBtn: {
    paddingVertical: 8,
    paddingBottom: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: darkMode ? "#2c2c2c" : "#e0e0e0",
  },
  selectedCategory: {
    backgroundColor: "#2196F3", // Keep this the same
  },
  categoryText: {
    fontSize: 14,
    color: darkMode ? "#ffffff" : "#000000",
  },
  selectedCategoryText: {
    fontSize: 14,
    color: "#ffffff",
  },
  taskList: {
    top: 10,
    bottom: 10,
    marginTop: 5,
    height: "78.3%",
    maxHeight: "78.8%",
    backgroundColor: darkMode ? "#121212" : "#f5f5f5",
  },
  taskCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    backgroundColor: darkMode ? "#1e1e1e" : "#ffffff",
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: darkMode ? "#ffffff" : "#000000",
  },
  taskDesc: {
    fontSize: 14,
    marginBottom: 5,
    color: darkMode ? "#cccccc" : "#000000",
  },
  taskDue: {
    fontSize: 13,
    color: darkMode ? "#bbbbbb" : "#555555",
    marginBottom: 5,
  },
  taskActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    backgroundColor: "#2196F3",
    borderRadius: 8,
  },
  actionText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  addBtn: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  addText: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "bold",
  },
});
