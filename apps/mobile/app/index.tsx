import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { onboardingStorage } from '@/lib/storage';
import { useAuthStore } from '@/stores/auth';

export default function Index() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617' }}>
        <ActivityIndicator color="#38bdf8" />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!onboardingStorage.getDone(user.id)) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  if (profile?.role === 'owner' || profile?.role === 'both') {
    return <Redirect href="/(owner)/dashboard" />;
  }

  return <Redirect href="/(seeker)/home" />;
}
