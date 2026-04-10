import { i18n } from '@/i18n/config';
import { languageStorage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

type NotificationPrefs = {
  booking_confirmed: boolean;
  check_in_request: boolean;
  check_in_approved: boolean;
  booking_reminder: boolean;
  session_ending: boolean;
  new_review: boolean;
  new_chat_message: boolean;
  no_show_warning: boolean;
  dispute_update: boolean;
};

const defaultPrefs: NotificationPrefs = {
  booking_confirmed: true,
  check_in_request: true,
  check_in_approved: true,
  booking_reminder: true,
  session_ending: true,
  new_review: true,
  new_chat_message: true,
  no_show_warning: true,
  dispute_update: true,
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const updatePreferredLanguage = useAuthStore((s) => s.updatePreferredLanguage);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);

  useEffect(() => {
    const raw = profile?.notification_preferences as Partial<NotificationPrefs> | undefined;
    if (!raw) return;
    setPrefs({ ...defaultPrefs, ...raw });
  }, [profile?.notification_preferences]);

  const setLanguage = async (lang: 'en' | 'ta') => {
    setSaving(true);
    await i18n.changeLanguage(lang);
    languageStorage.set(lang);
    await updatePreferredLanguage(lang);
    setSaving(false);
  };

  const setPref = async (key: keyof NotificationPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    if (!profile?.id) return;
    await supabase.from('users').update({ notification_preferences: next }).eq('id', profile.id);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('settings.title')}</Text>
      <Text style={styles.label}>{t('settings.language')}</Text>
      <View style={styles.row}>
        <Pressable style={[styles.btn, i18n.language === 'en' && styles.active]} onPress={() => void setLanguage('en')}>
          <Text style={styles.btnTx}>{t('settings.english')}</Text>
        </Pressable>
        <Pressable style={[styles.btn, i18n.language === 'ta' && styles.active]} onPress={() => void setLanguage('ta')}>
          <Text style={styles.btnTx}>{t('settings.tamil')}</Text>
        </Pressable>
      </View>
      <Text style={styles.label}>Notifications</Text>
      <View style={styles.col}>
        <ToggleRow
          label="Booking confirmed"
          enabled={prefs.booking_confirmed}
          onPress={() => void setPref('booking_confirmed', !prefs.booking_confirmed)}
        />
        <ToggleRow
          label="Check-in request"
          enabled={prefs.check_in_request}
          onPress={() => void setPref('check_in_request', !prefs.check_in_request)}
        />
        <ToggleRow
          label="Check-in approved"
          enabled={prefs.check_in_approved}
          onPress={() => void setPref('check_in_approved', !prefs.check_in_approved)}
        />
        <ToggleRow
          label="Booking reminder"
          enabled={prefs.booking_reminder}
          onPress={() => void setPref('booking_reminder', !prefs.booking_reminder)}
        />
        <ToggleRow
          label="Session ending"
          enabled={prefs.session_ending}
          onPress={() => void setPref('session_ending', !prefs.session_ending)}
        />
        <ToggleRow
          label="New review"
          enabled={prefs.new_review}
          onPress={() => void setPref('new_review', !prefs.new_review)}
        />
        <ToggleRow
          label="New chat message"
          enabled={prefs.new_chat_message}
          onPress={() => void setPref('new_chat_message', !prefs.new_chat_message)}
        />
        <ToggleRow
          label="No-show warning"
          enabled={prefs.no_show_warning}
          onPress={() => void setPref('no_show_warning', !prefs.no_show_warning)}
        />
        <ToggleRow
          label="Dispute update"
          enabled={prefs.dispute_update}
          onPress={() => void setPref('dispute_update', !prefs.dispute_update)}
        />
      </View>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>{saving ? t('common.loading') : t('common.back')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  label: { marginTop: 18, marginBottom: 8, color: '#64748b', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 10 },
  col: { gap: 8 },
  btn: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff' },
  active: { borderColor: '#0ea5e9', backgroundColor: '#e0f2fe' },
  btnTx: { color: '#0f172a', fontWeight: '600' },
  back: { marginTop: 24, color: '#0ea5e9', fontWeight: '700' },
});

function ToggleRow({ label, enabled, onPress }: { label: string; enabled: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={stylesToggle.row}>
      <Text style={stylesToggle.label}>{label}</Text>
      <View style={[stylesToggle.pill, enabled ? stylesToggle.pillOn : stylesToggle.pillOff]}>
        <Text style={stylesToggle.pillTx}>{enabled ? 'On' : 'Off'}</Text>
      </View>
    </Pressable>
  );
}

const stylesToggle = StyleSheet.create({
  row: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { color: '#0f172a', fontWeight: '500' },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillOn: { backgroundColor: '#d1fae5' },
  pillOff: { backgroundColor: '#e2e8f0' },
  pillTx: { fontSize: 12, fontWeight: '700', color: '#0f172a' },
});
