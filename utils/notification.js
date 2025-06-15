import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useRef, useEffect } from "react";
import { Platform } from "react-native";

const taskNotificationMap = new Map(); // maps task ID (or index) to notificationId

// Call this once in your App entry to ask permissions
export async function requestNotificationPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }
}

// Schedules a notification for a task
async function scheduleNotification(task, taskKey) {
  if (!Device.isDevice || !task.dueDate || !task.notify) return;

  const triggerDate = new Date(task.dueDate);
  if (triggerDate <= new Date()) return; // Skip if due date is in the past

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Task Reminder",
      body: task.title || "You have a task due",
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: triggerDate,
  });

  taskNotificationMap.set(taskKey, notificationId);
}

// Cancels a scheduled notification for a task
async function cancelNotification(taskKey) {
  const id = taskNotificationMap.get(taskKey);
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
    taskNotificationMap.delete(taskKey);
  }
}

// Call this when tasks change (ideally inside useEffect)
export async function syncTaskNotifications(tasks) {
  const now = new Date();

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const taskKey = task.title + task.dueDate; // or a unique ID if you have one

    if (task.notify && !task.done && new Date(task.dueDate) > now) {
      if (!taskNotificationMap.has(taskKey)) {
        await scheduleNotification(task, taskKey);
      }
    } else {
      await cancelNotification(taskKey);
    }
  }
}
