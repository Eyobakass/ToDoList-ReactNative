import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

const taskNotificationMap = new Map(); // taskKey => notificationId(s) (string or array)

// Ask permissions once
export async function requestNotificationPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }
}

// Schedule notification(s) for a task
export async function scheduleNotification(task, taskKey) {
  if (!Device.isDevice || !task.dueDate || !task.notify) return;

  const dueDate = new Date(task.dueDate);
  const now = new Date();

  if (dueDate <= now) return;

  let notifications = [];

  const createNotification = async (time, suffix = "") => {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task Reminder",
        body: `${task.title}${suffix}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: time,
    });
    return id;
  };

  if (task.importance === "high") {
    const before10 = new Date(dueDate.getTime() - 10 * 60 * 1000); // -10 min
    const atTime = dueDate;
    const after10 = new Date(dueDate.getTime() + 10 * 60 * 1000); // +10 min

    if (before10 > now) {
      notifications.push(
        await createNotification(before10, " - in 10 minutes")
      );
    }
    notifications.push(await createNotification(atTime));
    notifications.push(await createNotification(after10, " - overdue"));
  } else {
    // Medium or Low → only at due date
    notifications.push(await createNotification(dueDate));
  }

  if (task.location && task.location.latitude && task.location.longitude) {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      try {
        await Location.startGeofencingAsync("TASK_GEOFENCE", [
          {
            identifier: taskKey,
            latitude: task.location.latitude,
            longitude: task.location.longitude,
            radius: 100,
            notifyOnEnter: true,
            notifyOnExit: false,
          },
        ]);
      } catch (err) {
        console.warn("Geofencing error:", err);
      }
    }
  }


  taskNotificationMap.set(taskKey, notifications);
}

// Cancel all notifications for a task
export async function cancelNotification(taskKey) {
  const ids = taskNotificationMap.get(taskKey);
  if (!ids) return;

  const idList = Array.isArray(ids) ? ids : [ids];

  for (const id of idList) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
  await Location.stopGeofencingAsync("TASK_GEOFENCE").catch(() => {});

  taskNotificationMap.delete(taskKey);
}

// Sync based on current task list
export async function syncTaskNotifications(tasks) {
  const now = new Date();

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const taskKey = `${i}-${new Date(task.dueDate).getTime()}`;

    if (task.notify && !task.done && new Date(task.dueDate) > now) {
      if (!taskNotificationMap.has(taskKey)) {
        await scheduleNotification(task, taskKey);
      }
    } else {
      await cancelNotification(taskKey);
    }
  }
}
