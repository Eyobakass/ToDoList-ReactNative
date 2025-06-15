// Home.js
import React, { useCallback, useEffect, useState } from "react";
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
const categories = [
  "All",
  "Highly Important",
  "Medium Important",
  "Low Important",
  "Today",
  "Within A Week",
  "Within A Month",
  "Beyond A Month",
  "Completed Tasks",
];
import {
  requestNotificationPermission,
  syncTaskNotifications,
} from "../utils/notification";

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Today");
  const [activeWidget, setActiveWidget] = useState(null);
  const navigation = useNavigation();

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
      if (selectedCategory === "Medium Important")
        return task.importance === "medium" && !task.done;
      if (selectedCategory === "Low Important")
        return task.importance === "low" && !task.done;
      if (selectedCategory === "Today")
        return moment(task.dueDate).isSame(now, "day") && !task.done;
      if (selectedCategory === "Within A Week")
        return moment(task.dueDate).diff(now, "days") <= 7 && !task.done;
      if (selectedCategory === "Within A Month")
        return moment(task.dueDate).diff(now, "days") <= 30 && !task.done;
      if (selectedCategory === "Beyond A Month")
        return moment(task.dueDate).diff(now, "days") > 30 && !task.done;
      if (selectedCategory === "Completed Tasks") return task.done === true;
      return false;
    });
    setFilteredTasks(result);
  };

  const handleNotifyToggle = (taskIndex) => {
    const updated = [...tasks];
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
            onValueChange={() => handleCheckToggle(tasks.indexOf(item))}
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
                if (navigationRef.isReady()) {
                  navigationRef.navigate("EditTaskForm", {
                    task: item,
                    index: tasks.indexOf(item),
                  });
                }
              }}
            >
              <Text style={styles.actionText}>✏️ Edit</Text>
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
      <Text style={styles.header}>Tasks</Text>
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

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingHorizontal: 15,
    backgroundColor: "#f5f5f5",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
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
    backgroundColor: "#e0e0e0",
  },
  selectedCategory: {
    backgroundColor: "#2196F3",
  },
  categoryText: {
    fontSize: 14,
    color: "#000",
  },
  selectedCategoryText: {
    fontSize: 14,
    color: "#fff",
  },
  taskList: {
    top: 10,
    bottom: 10,
    marginTop: 5,
    height: "80%",
  },
  taskCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
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
  },
  taskDesc: {
    fontSize: 14,
    marginBottom: 5,
  },
  taskDue: {
    fontSize: 13,
    color: "#555",
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
    color: "#fff",
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
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
});
