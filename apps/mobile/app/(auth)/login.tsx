import { signInSchema, signUpSchema } from '@parknear/shared';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { useAuthStore } from '@/stores/auth';

// ─── Brand colours ────────────────────────────────────────────────────────────
const NAVY   = '#020617';
const CARD   = '#0f172a';
const BORDER = '#1e293b';
const MUTED  = '#334155';
const SLATE  = '#94a3b8';
const WHITE  = '#f8fafc';
const BLUE   = '#0ea5e9';
const RED    = '#f87171';

// ─── Mode toggle ─────────────────────────────────────────────────────────────
type Mode = 'signIn' | 'signUp';

export default function LoginScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);

  const [mode,            setMode]            = useState<Mode>('signIn');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName,        setFullName]        = useState('');
  const [phone,           setPhone]           = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [pending,         setPending]         = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword('');
    setConfirmPassword('');
    setPhone('');
  }

  async function onSubmit() {
    setError(null);

    if (mode === 'signIn') {
      // ── Validate ──────────────────────────────────────────────────────────
      const parsed = signInSchema.safeParse({ email: email.trim(), password });
      if (!parsed.success) {
        setError(parsed.error.errors[0]?.message ?? 'Invalid details');
        return;
      }

      setPending(true);
      const { error: err } = await signIn(parsed.data.email, parsed.data.password);
      setPending(false);

      if (err) {
        const msg = err.message.includes('Invalid login credentials')
          ? 'Incorrect email or password.'
          : err.message;
        setError(msg);
        Toast.show({ type: 'error', text1: 'Sign in failed', text2: msg });
      }
      // On success Expo Router's root layout re-renders based on session state.

    } else {
      // ── Validate ──────────────────────────────────────────────────────────
      const parsed = signUpSchema.safeParse({
        email:           email.trim(),
        password,
        confirmPassword,
        full_name:       fullName.trim(),
        phone,
      });
      if (!parsed.success) {
        setError(parsed.error.errors[0]?.message ?? 'Invalid details');
        return;
      }

      setPending(true);
      const { error: err } = await signUp(
        parsed.data.email,
        parsed.data.password,
        parsed.data.full_name,
        parsed.data.phone,
      );
      setPending(false);

      if (err) {
        const msg = err.message;
        setError(msg);
        Toast.show({ type: 'error', text1: 'Registration failed', text2: msg });
      }
    }
  }

  const isSignUp = mode === 'signUp';

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Brand */}
          <Text style={styles.brand}>ParkNear</Text>
          <Text style={styles.tagline}>Find &amp; rent parking spots nearby</Text>

          {/* Mode toggle */}
          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, mode === 'signIn' && styles.tabActive]}
              onPress={() => switchMode('signIn')}
            >
              <Text style={[styles.tabText, mode === 'signIn' && styles.tabTextActive]}>
                Sign in
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, mode === 'signUp' && styles.tabActive]}
              onPress={() => switchMode('signUp')}
            >
              <Text style={[styles.tabText, mode === 'signUp' && styles.tabTextActive]}>
                Create account
              </Text>
            </Pressable>
          </View>

          {/* Full name (sign-up only) */}
          {isSignUp && (
            <>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={styles.input}
                placeholder="Jane Smith"
                placeholderTextColor={SLATE}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
              />
              <Text style={styles.label}>Mobile number</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit Indian number"
                placeholderTextColor={SLATE}
                keyboardType="phone-pad"
                autoComplete="tel"
                maxLength={15}
                value={phone}
                onChangeText={setPhone}
                returnKeyType="next"
              />
            </>
          )}

          {/* Email */}
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={SLATE}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
          />

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="••••••••"
              placeholderTextColor={SLATE}
              secureTextEntry={!showPassword}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChangeText={setPassword}
              returnKeyType={isSignUp ? 'next' : 'done'}
              onSubmitEditing={isSignUp ? undefined : onSubmit}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
            >
              <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm password (sign-up only) */}
          {isSignUp && (
            <>
              <Text style={styles.label}>Confirm password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="••••••••"
                  placeholderTextColor={SLATE}
                  secureTextEntry={!showConfirm}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  returnKeyType="done"
                  onSubmitEditing={onSubmit}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirm((v) => !v)}
                  hitSlop={8}
                >
                  <Text style={styles.eyeText}>{showConfirm ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Error */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              pending && styles.buttonDisabled,
            ]}
            onPress={onSubmit}
            disabled={pending}
          >
            {pending ? (
              <ActivityIndicator color={NAVY} />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? 'Create account' : 'Sign in'}
              </Text>
            )}
          </Pressable>

          {/* Footer hint */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            </Text>
            <TouchableOpacity onPress={() => switchMode(isSignUp ? 'signIn' : 'signUp')}>
              <Text style={styles.footerLink}>
                {isSignUp ? 'Sign in' : 'Create one'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: NAVY,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
    padding: 24,
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: BLUE,
  },
  tagline: {
    marginTop: 4,
    marginBottom: 24,
    color: SLATE,
    fontSize: 14,
  },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabs: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: BLUE,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: SLATE,
  },
  tabTextActive: {
    color: NAVY,
  },

  // ── Fields ────────────────────────────────────────────────────────────────
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: SLATE,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: MUTED,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: WHITE,
    marginBottom: 14,
    fontSize: 15,
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 10,
    padding: 2,
  },
  eyeText: {
    fontSize: 18,
  },

  // ── Feedback ──────────────────────────────────────────────────────────────
  error: {
    color: RED,
    marginBottom: 12,
    fontSize: 13,
  },

  // ── Button ────────────────────────────────────────────────────────────────
  button: {
    backgroundColor: BLUE,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 16,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
  },
  footerText: {
    color: SLATE,
    fontSize: 13,
  },
  footerLink: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '600',
  },
});
