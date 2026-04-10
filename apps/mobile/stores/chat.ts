import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

import type { RealtimeChannel } from '@supabase/supabase-js';

export type ChatMessageRow = {
  id: string;
  booking_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

type ChatStore = {
  messagesByBooking: Record<string, ChatMessageRow[]>;
  unreadByBooking: Record<string, number>;
  channels: Record<string, RealtimeChannel | undefined>;
  fetchMessages: (bookingId: string) => Promise<void>;
  sendMessage: (bookingId: string, receiverId: string, content: string) => Promise<{ error: Error | null }>;
  subscribe: (bookingId: string, onEvent: () => void) => void;
  unsubscribe: (bookingId: string) => void;
  markRead: (bookingId: string) => Promise<void>;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messagesByBooking: {},
  unreadByBooking: {},
  channels: {},

  fetchMessages: async (bookingId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });
    if (error) return;
    set((s) => ({
      messagesByBooking: { ...s.messagesByBooking, [bookingId]: (data ?? []) as ChatMessageRow[] },
    }));
  },

  sendMessage: async (bookingId, receiverId, content) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not signed in') };
    const { error } = await supabase.from('messages').insert({
      booking_id: bookingId,
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
      is_read: false,
    });
    return { error: error ? new Error(error.message) : null };
  },

  subscribe: (bookingId, onEvent) => {
    get().unsubscribe(bookingId);
    const channel = supabase
      .channel(`chat:${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` },
        () => {
          void get().fetchMessages(bookingId);
          onEvent();
        }
      )
      .subscribe();
    set((s) => ({ channels: { ...s.channels, [bookingId]: channel } }));
  },

  unsubscribe: (bookingId) => {
    const ch = get().channels[bookingId];
    if (ch) {
      void supabase.removeChannel(ch);
      set((s) => {
        const next = { ...s.channels };
        delete next[bookingId];
        return { channels: next };
      });
    }
  },

  markRead: async (bookingId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('booking_id', bookingId)
      .eq('receiver_id', user.id)
      .eq('is_read', false);
  },
}));
