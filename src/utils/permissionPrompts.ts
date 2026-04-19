import { Alert } from "react-native";

function confirmPermission(title: string, message: string, actionLabel: string) {
  return new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      { text: "Not now", style: "cancel", onPress: () => resolve(false) },
      { text: actionLabel, onPress: () => resolve(true) },
    ]);
  });
}

export function confirmLocationPermission() {
  return confirmPermission(
    "Allow location for prayer times?",
    "Quran uses your location only to calculate accurate prayer times and Qibla direction. You can use a manual location instead.",
    "Continue"
  );
}

export function confirmNotificationPermission() {
  return confirmPermission(
    "Enable Quran reminders?",
    "Notifications are used for prayer alerts, daily ayah, and reading reminders. You can turn them off anytime in Settings.",
    "Enable"
  );
}
