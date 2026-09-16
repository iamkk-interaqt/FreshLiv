import { Stack } from 'expo-router';
import { useEffect } from 'react';
import {
  registerForPushNotifications,
  subscribeToNotificationEvents,
  subscribeToRealtimeNotifications,
} from '../src/services/notifications';
import { AuthProvider } from '../src/auth/AuthProvider';

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

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
