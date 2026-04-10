import { Stack } from 'expo-router';

export default function SeekerLayout() {
  return (
    <Stack>
      <Stack.Screen name="home" options={{ title: 'Home', headerShown: true }} />
    </Stack>
  );
}
