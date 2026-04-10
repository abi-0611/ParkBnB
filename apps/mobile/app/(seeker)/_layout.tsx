import { Stack } from 'expo-router';

export default function SeekerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="spot/[id]" options={{ headerShown: true, title: 'Spot' }} />
    </Stack>
  );
}
