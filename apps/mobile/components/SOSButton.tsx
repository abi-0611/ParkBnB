import { supabase } from '@/lib/supabase';
import { useLocation } from '@/hooks/useLocation';
import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  bookingId?: string;
};

export function SOSButton({ bookingId }: Props) {
  const { latitude, longitude } = useLocation();
  const [busy, setBusy] = useState(false);

  const onSos = () => {
    Alert.alert(
      'Emergency SOS',
      'This logs an alert with ParkNear support and shows local emergency numbers. For life-threatening emergencies, call 100 or 112.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (!user) return;
              let lat = latitude;
              let lng = longitude;
              const perm = await Location.getForegroundPermissionsAsync();
              if (perm.status === Location.PermissionStatus.GRANTED) {
                const p = await Location.getCurrentPositionAsync({});
                lat = p.coords.latitude;
                lng = p.coords.longitude;
              }
              await supabase.from('sos_events').insert({
                user_id: user.id,
                booking_id: bookingId ?? null,
                lat,
                lng,
                note: 'user_triggered',
              });
              Alert.alert(
                'SOS logged',
                'Chennai police: 100\nWomen helpline: 181\nAmbulance: 108',
                [{ text: 'OK' }]
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Pressable style={styles.btn} onPress={onSos} disabled={busy}>
      <Text style={styles.tx}>SOS</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tx: { color: '#fff', fontWeight: '900', fontSize: 13 },
});
