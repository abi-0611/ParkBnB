import { ChatBubble } from '@/components/ChatBubble';
import { SOSButton } from '@/components/SOSButton';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatBookingScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const role = useAuthStore((s) => s.profile?.role);
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [otherName, setOtherName] = useState('');
  const [spotTitle, setSpotTitle] = useState('');
  const [otherId, setOtherId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [uid, setUid] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const messages = useChatStore((s) => (bookingId ? s.messagesByBooking[bookingId] ?? [] : []));
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const subscribe = useChatStore((s) => s.subscribe);
  const unsubscribe = useChatStore((s) => s.unsubscribe);
  const markRead = useChatStore((s) => s.markRead);

  const loadCtx = useCallback(async () => {
    if (!bookingId) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUid(user?.id ?? null);
    if (!user) return;

    const { data: b } = await supabase
      .from('bookings')
      .select(
        `
        id,
        seeker_id,
        status,
        start_time,
        spots ( title, owner_id )
      `
      )
      .eq('id', bookingId)
      .single();

    if (!b) return;
    const row = b as unknown as {
      seeker_id: string;
      spots: { title: string; owner_id: string } | null;
    };
    setSpotTitle(row.spots?.title ?? 'Booking');
    const oid = user.id === row.seeker_id ? row.spots?.owner_id : row.seeker_id;
    setOtherId(oid ?? null);
    if (oid) {
      const { data: u } = await supabase.from('users').select('full_name').eq('id', oid).single();
      setOtherName((u as { full_name: string } | null)?.full_name ?? 'Host');
    }
  }, [bookingId]);

  useEffect(() => {
    void loadCtx();
  }, [loadCtx]);

  useEffect(() => {
    if (!bookingId) return;
    void fetchMessages(bookingId);
    subscribe(bookingId, () => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    void markRead(bookingId);
    return () => unsubscribe(bookingId);
  }, [bookingId, fetchMessages, subscribe, unsubscribe, markRead]);

  const onSend = async () => {
    if (!bookingId || !otherId || !input.trim()) return;
    setSending(true);
    const { error } = await sendMessage(bookingId, otherId, input);
    if (!error) {
      setInput('');
      void fetchMessages(bookingId);
      Toast.show({ type: 'success', text1: 'Message sent' });
    } else {
      Toast.show({ type: 'error', text1: 'Failed to send message', text2: error.message });
    }
    setSending(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 48}
    >
      <Pressable
        onPress={() => {
          if (role === 'owner' || role === 'both') router.push('/(owner)/dashboard');
          else router.push(`/(seeker)/booking/confirmation/${bookingId}`);
        }}
        style={styles.banner}
      >
        <Text style={styles.bannerTx} numberOfLines={1}>
          {spotTitle} · tap for booking
        </Text>
      </Pressable>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{otherName}</Text>
        <SOSButton bookingId={bookingId} />
      </View>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingBottom: 12 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.sender_id === uid;
          return (
            <ChatBubble
              text={item.content}
              time={new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              mine={mine}
              read={item.is_read}
            />
          );
        }}
      />
      <View style={[styles.inputRow, { paddingBottom: Math.max(12, insets.bottom) }]}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
        />
        <Pressable style={styles.send} onPress={() => void onSend()} disabled={sending}>
          <Text style={styles.sendTx}>{sending ? '...' : 'Send'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  banner: { padding: 10, backgroundColor: '#e0f2fe', borderBottomWidth: 1, borderBottomColor: '#bae6fd' },
  bannerTx: { color: '#0369a1', fontWeight: '600', fontSize: 13 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  send: { backgroundColor: '#0ea5e9', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  sendTx: { color: '#fff', fontWeight: '800' },
});
