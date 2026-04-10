import { Stack } from 'expo-router';

export default function SeekerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="spot/[id]" options={{ headerShown: true, title: 'Spot' }} />
      <Stack.Screen name="booking/[spotId]" options={{ headerShown: true, title: 'Book' }} />
      <Stack.Screen name="booking/confirmation/[bookingId]" options={{ headerShown: true, title: 'Confirmed' }} />
      <Stack.Screen name="booking/review/[bookingId]" options={{ headerShown: true, title: 'Review' }} />
      <Stack.Screen name="bookings" options={{ headerShown: true, title: 'My bookings' }} />
    </Stack>
  );
}
