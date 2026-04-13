import { Stack } from 'expo-router';

export default function CommonLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#f8fafc' },
        headerTintColor: '#0f172a',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      <Stack.Screen name="profile/index"             options={{ title: 'My Profile' }} />
      <Stack.Screen name="profile/kyc"               options={{ title: 'KYC Verification' }} />
      <Stack.Screen name="profile/emergency-contacts" options={{ title: 'Emergency Contacts' }} />
      <Stack.Screen name="settings"                  options={{ title: 'Settings' }} />
      <Stack.Screen name="chat/[bookingId]"          options={{ title: 'Chat' }} />
      <Stack.Screen name="chat/index"                options={{ title: 'Messages' }} />
      <Stack.Screen name="support/dispute/[bookingId]" options={{ title: 'Dispute' }} />
    </Stack>
  );
}
