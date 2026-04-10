import { loginSchema, signUpSchema } from '@parknear/shared';
import { useRouter } from 'expo-router';
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
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

const primary = '#0ea5e9';

export default function LoginScreen() {
  const router = useRouter();
  const signInWithOtp = useAuthStore((s) => s.signInWithOtp);
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    setError(null);
    const parsed = signUpSchema.safeParse({ email, full_name: fullName.trim() || 'ParkSeeker' });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid details');
      return;
    }
    const emailOk = loginSchema.safeParse({ email: parsed.data.email });
    if (!emailOk.success) {
      setError(emailOk.error.errors[0]?.message ?? 'Invalid email');
      return;
    }
    setPending(true);
    const { error: err } = await signInWithOtp(parsed.data.email, parsed.data.full_name);
    setPending(false);
    if (err) {
      setError(err.message);
      Toast.show({ type: 'error', text1: 'Sign in failed', text2: err.message });
      return;
    }
    Toast.show({ type: 'success', text1: 'OTP sent', text2: parsed.data.email });
    router.push({ pathname: '/(auth)/verify', params: { email: parsed.data.email } });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.brand}>ParkNear</Text>
        <Text style={styles.tagline}>{t('auth.tagline')}</Text>

        <Text style={styles.label}>{t('auth.fullName')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('auth.fullName')}
          placeholderTextColor="#64748b"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />

        <Text style={styles.label}>{t('auth.email')}</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#64748b"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, { backgroundColor: primary }]}
          onPress={onSubmit}
          disabled={pending}
        >
          {pending ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.buttonText}>{t('auth.sendOtp')}</Text>}
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
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: primary,
  },
  tagline: {
    marginTop: 4,
    marginBottom: 24,
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
});
