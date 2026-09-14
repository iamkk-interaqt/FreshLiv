import { Stack } from 'expo-router';
import { useEffect } from 'react';
import {
  registerForPushNotifications,
  subscribeToNotificationEvents,
  subscribeToRealtimeNotifications,
} from '../src/services/notifications';

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotifications().catch(() => undefined);

    const unsubscribeNative = subscribeToNotificationEvents();
    const unsubscribeRealtime = subscribeToRealtimeNotifications();

    return () => {
      unsubscribeNative();
      unsubscribeRealtime();
    };
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
