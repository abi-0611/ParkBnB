import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

export default function SeekerHomeScreen() {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const [spotCount, setSpotCount] = useState<number | null>(null);

  const load = useCallback(async () => {
    const { count, error } = await supabase.from('spots_public').select('*', { count: 'exact', head: true });
    if (!error) setSpotCount(count);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to ParkNear</Text>
      <Text style={styles.name}>{profile?.full_name ?? 'Explorer'}</Text>
      <Text style={styles.muted}>
        {spotCount !== null ? (
          <>
            <Text style={styles.count}>{spotCount}</Text> active spots in Chennai
          </>
        ) : (
          'Loading spots…'
        )}
      </Text>

      <Pressable style={styles.button} onPress={() => void signOut()}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#38bdf8',
  },
  name: {
    marginTop: 8,
    fontSize: 18,
    color: '#f8fafc',
  },
  muted: {
    marginTop: 12,
    fontSize: 15,
    color: '#94a3b8',
  },
  count: {
    fontWeight: '700',
    color: '#34d399',
  },
  button: {
    marginTop: 32,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#e2e8f0',
    fontWeight: '600',
  },
});
