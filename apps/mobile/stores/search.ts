import {
  type SearchSpotsNearbyParams,
  type SearchSpotsResult,
  type SeekerSortKey,
  searchSpotsNearby,
} from '@parknear/shared';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

export type SearchFiltersState = {
  spotType: 'car' | 'bike' | 'both' | 'ev_charging' | null;
  coverage: 'covered' | 'open' | 'underground' | null;
  maxPricePerHour: number | null;
  vehicleSize: 'hatchback' | 'sedan' | 'suv' | null;
  hasEVCharging: boolean;
  isInstantBook: boolean | null;
  minRating: number | null;
  availableNow: boolean;
};

function sortResults(rows: SearchSpotsResult[], sort: SeekerSortKey): SearchSpotsResult[] {
  const copy = [...rows];
  const ph = (s: SearchSpotsResult) => {
    const v = s.price_per_hour;
    if (v == null) return Number.POSITIVE_INFINITY;
    return typeof v === 'number' ? v : Number(v);
  };
  const rating = (s: SearchSpotsResult) => {
    const v = s.avg_rating;
    if (v == null) return 0;
    return typeof v === 'number' ? v : Number(v);
  };

  switch (sort) {
    case 'distance':
      return copy.sort((a, b) => a.distance_meters - b.distance_meters);
    case 'price_low':
      return copy.sort((a, b) => ph(a) - ph(b));
    case 'price_high':
      return copy.sort((a, b) => ph(b) - ph(a));
    case 'rating':
      return copy.sort((a, b) => rating(b) - rating(a) || a.distance_meters - b.distance_meters);
    default:
      return copy;
  }
}

function applyClientFilters(rows: SearchSpotsResult[], f: SearchFiltersState): SearchSpotsResult[] {
  let out = rows;
  if (f.hasEVCharging) {
    out = out.filter((s) => {
      const raw = s.amenities;
      if (raw == null) return false;
      try {
        const str = JSON.stringify(raw).toLowerCase();
        return str.includes('ev') || str.includes('charging');
      } catch {
        return false;
      }
    });
  }
  return out;
}

const defaultFilters: SearchFiltersState = {
  spotType: null,
  coverage: null,
  maxPricePerHour: null,
  vehicleSize: null,
  hasEVCharging: false,
  isInstantBook: null,
  minRating: null,
  availableNow: false,
};

type SearchStore = {
  spots: SearchSpotsResult[];
  rawSpots: SearchSpotsResult[];
  isLoading: boolean;
  error: string | null;
  filters: SearchFiltersState;
  sortBy: SeekerSortKey;
  searchRadius: number;
  userLocation: { lat: number; lng: number } | null;
  selectedSpotId: string | null;
  searchNearby: (lat: number, lng: number) => Promise<void>;
  applyFilters: (next: Partial<SearchFiltersState>, radiusMeters?: number) => void;
  setFilter: <K extends keyof SearchFiltersState>(key: K, value: SearchFiltersState[K]) => void;
  setSortBy: (sort: SeekerSortKey) => void;
  setSearchRadius: (meters: number) => void;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  clearFilters: () => void;
  selectSpot: (id: string | null) => void;
};

export const useSearchStore = create<SearchStore>((set, get) => ({
  spots: [],
  rawSpots: [],
  isLoading: false,
  error: null,
  filters: { ...defaultFilters },
  sortBy: 'distance',
  searchRadius: 2000,
  userLocation: null,
  selectedSpotId: null,

  setUserLocation: (loc) => set({ userLocation: loc }),

  searchNearby: async (lat, lng) => {
    set({ isLoading: true, error: null, userLocation: { lat, lng } });
    const { filters, sortBy, searchRadius } = get();

    const params: SearchSpotsNearbyParams = {
      lat,
      lng,
      radius_meters: Math.min(5000, Math.max(500, searchRadius)),
      spot_type: filters.spotType,
      max_price: filters.maxPricePerHour,
      coverage: filters.coverage,
      min_rating: filters.minRating,
      instant_book_only: filters.isInstantBook === true ? true : null,
      vehicle_size: filters.vehicleSize,
    };

    const { data, error } = await searchSpotsNearby(supabase, params);
    if (error) {
      set({ isLoading: false, error: error.message, spots: [], rawSpots: [] });
      return;
    }

    let raw = applyClientFilters(data, filters);
    raw = sortResults(raw, sortBy);
    set({ isLoading: false, error: null, rawSpots: data, spots: raw });
  },

  applyFilters: (next, radiusMeters) => {
    set((state) => ({
      filters: { ...state.filters, ...next },
      ...(radiusMeters != null ? { searchRadius: radiusMeters } : {}),
    }));
    const loc = get().userLocation;
    if (loc) void get().searchNearby(loc.lat, loc.lng);
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
    const loc = get().userLocation;
    if (loc) void get().searchNearby(loc.lat, loc.lng);
  },

  setSortBy: (sort) => {
    set({ sortBy: sort });
    const loc = get().userLocation;
    const raw = get().rawSpots;
    if (!loc) return;
    let next = applyClientFilters(raw, get().filters);
    next = sortResults(next, sort);
    set({ spots: next });
  },

  setSearchRadius: (meters) => {
    set({ searchRadius: meters });
    const loc = get().userLocation;
    if (loc) void get().searchNearby(loc.lat, loc.lng);
  },

  clearFilters: () => {
    set({ filters: { ...defaultFilters } });
    const loc = get().userLocation;
    if (loc) void get().searchNearby(loc.lat, loc.lng);
  },

  selectSpot: (id) => set({ selectedSpotId: id }),
}));
