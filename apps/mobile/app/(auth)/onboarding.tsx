import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { onboardingStorage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

import type { UserRole } from '@parknear/shared';

const primary = '#0ea5e9';

const roles: { id: UserRole; label: string; hint: string }[] = [
  { id: 'seeker', label: 'Seeker', hint: 'Find and book parking' },
  { id: 'owner', label: 'Owner', hint: 'List your spare spots' },
  { id: 'both', label: 'Both', hint: 'Book and list parking' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [selected, setSelected] = useState<UserRole>('seeker');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onContinue() {
    if (!user) {
      setError('Not signed in');
      return;
    }
    setError(null);
    setPending(true);
    const { error: err } = await supabase.from('users').update({ role: selected }).eq('id', user.id);
    setPending(false);
    if (err) {
      setError(err.message);
      return;
    }
    onboardingStorage.setDone(user.id);
    await fetchProfile();
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How will you use ParkNear?</Text>
      <Text style={styles.sub}>Pick a role — you can change this later.</Text>

      <View style={styles.list}>
        {roles.map((r) => {
          const active = selected === r.id;
          return (
            <Pressable
              key={r.id}
              onPress={() => setSelected(r.id)}
              style={[styles.option, active && styles.optionActive]}
            >
              <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>{r.label}</Text>
              <Text style={styles.optionHint}>{r.hint}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, pending && { opacity: 0.7 }]}
        onPress={onContinue}
        disabled={pending}
      >
        <Text style={styles.buttonText}>{pending ? 'Saving…' : 'Continue'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 24,
    paddingTop: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
  },
  sub: {
    marginTop: 8,
    color: '#94a3b8',
    fontSize: 15,
    marginBottom: 28,
  },
  list: {
    gap: 12,
  },
  option: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    backgroundColor: '#0f172a',
  },
  optionActive: {
    borderColor: primary,
    backgroundColor: '#0c4a6e33',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  optionTitleActive: {
    color: primary,
  },
  optionHint: {
    marginTop: 4,
    color: '#94a3b8',
    fontSize: 13,
  },
  error: {
    marginTop: 16,
    color: '#f87171',
  },
  button: {
    marginTop: 28,
    backgroundColor: primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16,
  },
});
