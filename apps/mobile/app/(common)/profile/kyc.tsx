import { DocumentUploader } from '@/components/DocumentUploader';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function KycScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [aadhaar, setAadhaar] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [property, setProperty] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('users').select('kyc_status').eq('id', user.id).single();
    setStatus((data as { kyc_status: string })?.kyc_status ?? 'pending');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (localUri: string, path: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Auth');
    const filePath = `${user.id}/${path}`;
    const res = await fetch(localUri);
    const blob = await res.blob();
    const { error } = await supabase.storage.from('kyc-documents').upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });
    if (error) throw error;
    return filePath;
  };

  const submit = async () => {
    if (!aadhaar || !selfie) return;
    setBusy(true);
    try {
      const aPath = await upload(aadhaar, 'aadhaar.jpg');
      const sPath = await upload(selfie, 'selfie.jpg');
      let pPath: string | null = null;
      if (property) pPath = await upload(property, 'property.jpg');

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('users')
        .update({
          aadhaar_doc_url: aPath,
          selfie_url: sPath,
          property_proof_url: pPath,
          kyc_status: 'submitted',
        })
        .eq('id', user.id);

      setStatus('submitted');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.wrap, { paddingBottom: Math.max(40, insets.bottom + 24) }]}>
      <Text style={styles.status}>Status: {status}</Text>
      <DocumentUploader label="ID document (Aadhaar / PAN)" valueUri={aadhaar} onPick={setAadhaar} />
      <DocumentUploader label="Selfie" valueUri={selfie} onPick={setSelfie} />
      <DocumentUploader label="Property proof (owners)" valueUri={property} onPick={setProperty} />
      <Pressable style={styles.primary} disabled={busy || !aadhaar || !selfie} onPress={() => void submit()}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryTx}>Submit for review</Text>}
      </Pressable>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.link}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 40, backgroundColor: '#f8fafc' },
  status: { fontWeight: '700', marginBottom: 8, color: '#0f172a' },
  primary: {
    marginTop: 24,
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryTx: { color: '#fff', fontWeight: '800' },
  link: { marginTop: 16, color: '#64748b', textAlign: 'center' },
});
