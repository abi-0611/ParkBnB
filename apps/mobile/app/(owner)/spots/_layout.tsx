import { Stack } from 'expo-router';

export default function OwnerSpotsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#020617' },
        headerTintColor: '#e2e8f0',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#020617' },
      }}
    >
      <Stack.Screen name="create" options={{ title: 'List a spot' }} />
      <Stack.Screen name="[id]" options={{ title: 'Edit spot' }} />
    </Stack>
  );
}
