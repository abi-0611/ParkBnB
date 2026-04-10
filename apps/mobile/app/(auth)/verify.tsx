import { otpVerifySchema } from '@parknear/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuthStore } from '@/stores/auth';

const accent = '#10b981';

export default function VerifyScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string | string[] }>();
  const email = Array.isArray(emailParam) ? (emailParam[0] ?? '') : (emailParam ?? '');

  const verifyOtp = useAuthStore((s) => s.verifyOtp);

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    setError(null);
    const parsed = otpVerifySchema.safeParse({ email, otp });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid code');
      return;
    }
    setPending(true);
    const { error: err } = await verifyOtp(parsed.data.email, parsed.data.otp);
    setPending(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.replace('/');
  }

  if (!email) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Missing email. Go back to login.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.muted}>Sent to {email}</Text>

        <Text style={styles.label}>6-digit code</Text>
        <TextInput
          style={styles.input}
          placeholder="000000"
          placeholderTextColor="#64748b"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={(t) => setOtp(t.replace(/\D/g, ''))}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, { backgroundColor: accent }]}
          onPress={onSubmit}
          disabled={pending}
        >
          {pending ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.buttonText}>Verify</Text>}
        </Pressable>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Change email</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0f172a',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
  },
  muted: {
    marginTop: 6,
    marginBottom: 20,
    color: '#94a3b8',
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    letterSpacing: 8,
    fontSize: 20,
    marginBottom: 16,
  },
  error: {
    color: '#f87171',
    marginBottom: 12,
    fontSize: 13,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16,
  },
  link: {
    marginTop: 16,
    textAlign: 'center',
    color: '#38bdf8',
    fontSize: 14,
  },
});
