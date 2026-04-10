import type { Spot } from '@parknear/shared';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

export type OwnerStats = {
  activeListings: number;
  totalBookingsMonth: number;
  monthlyEarnings: number;
  avgRating: number;
};

type State = {
  spots: Spot[];
  stats: OwnerStats;
  loading: boolean;
  error: string | null;
  fetchDashboard: (userId: string) => Promise<void>;
  toggleSpotActive: (spotId: string, isActive: boolean) => Promise<{ error: string | null }>;
  deleteSpot: (spotId: string) => Promise<{ error: string | null }>;
};

const emptyStats: OwnerStats = {
  activeListings: 0,
  totalBookingsMonth: 0,
  monthlyEarnings: 0,
  avgRating: 0,
};

export const useOwnerDashboardStore = create<State>((set, get) => ({
  spots: [],
  stats: emptyStats,
  loading: false,
  error: null,

  fetchDashboard: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const { data: spotRows, error: se } = await supabase
        .from('spots')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (se) throw se;

      const spots = (spotRows ?? []) as Spot[];
      const spotIds = spots.map((s) => s.id);

      let totalBookingsMonth = 0;
      let monthlyEarnings = 0;
      let ratingSum = 0;
      let ratingCount = 0;

      if (spotIds.length) {
        const { data: bookings, error: be } = await supabase
          .from('bookings')
          .select('id, spot_id, status, owner_payout, created_at')
          .in('spot_id', spotIds)
          .gte('created_at', start.toISOString());

        if (be) throw be;
        for (const b of bookings ?? []) {
          totalBookingsMonth += 1;
          if (b.status === 'completed' && b.owner_payout != null) {
            monthlyEarnings += Number(b.owner_payout);
          }
        }
      }

      for (const s of spots) {
        if (Number(s.total_reviews) > 0) {
          ratingSum += Number(s.avg_rating);
          ratingCount += 1;
        }
      }

      const activeListings = spots.filter((s) => s.is_active).length;
      const avgRating = ratingCount ? ratingSum / ratingCount : 0;

      set({
        spots,
        stats: {
          activeListings,
          totalBookingsMonth,
          monthlyEarnings,
          avgRating,
        },
        loading: false,
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Failed to load',
        loading: false,
      });
    }
  },

  toggleSpotActive: async (spotId, isActive) => {
    const { error } = await supabase.from('spots').update({ is_active: isActive }).eq('id', spotId);
    if (!error) {
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) await get().fetchDashboard(data.user.id);
    }
    return { error: error?.message ?? null };
  },

  deleteSpot: async (spotId) => {
    const { error } = await supabase.from('spots').update({ is_active: false }).eq('id', spotId);
    if (!error) {
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) await get().fetchDashboard(data.user.id);
    }
    return { error: error?.message ?? null };
  },
}));
