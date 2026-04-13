import { Stack } from 'expo-router';

export default function OwnerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#020617' },
        headerTintColor: '#e2e8f0',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#020617' },
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Your listings' }} />
      <Stack.Screen name="spots" options={{ headerShown: false }} />
      <Stack.Screen name="earnings" options={{ title: 'Earnings' }} />
      <Stack.Screen name="booking/review/[bookingId]" options={{ title: 'Review guest' }} />
    </Stack>
  );
}
