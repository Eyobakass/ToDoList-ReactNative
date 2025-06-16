import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";

const GEOFENCE_TASK = "TASK_GEOFENCE";

// This runs in the background when geofence is triggered
TaskManager.defineTask(
  GEOFENCE_TASK,
  ({ data: { eventType, region }, error }) => {
    if (error) {
      console.error("Geofencing task error:", error);
      return;
    }

    if (eventType === Location.GeofencingEventType.Enter) {
      Notifications.scheduleNotificationAsync({
        content: {
          title: "Location Reminder",
          body: `You're near the location for: ${region.identifier}`,
          sound: true,
        },
        trigger: null, // immediately
      });
    }
  }
);
