import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { registerForPushNotifications, subscribeToNotificationEvents } from '../src/services/notifications';

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotifications().catch(() => undefined);
    return subscribeToNotificationEvents();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
