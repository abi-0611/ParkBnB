import type { Coverage, SpotType, VehicleSize } from '@parknear/shared';
import { create } from 'zustand';

export const AMENITY_OPTIONS = [
  { id: 'cctv', label: 'CCTV' },
  { id: 'security', label: 'Security Guard' },
  { id: 'shade', label: 'Shade' },
  { id: 'ev_charger', label: 'EV Charger' },
  { id: 'wash_bay', label: 'Wash Bay' },
  { id: 'well_lit', label: 'Well Lit' },
  { id: 'easy_access', label: 'Easy Access' },
] as const;

export type CreateSpotState = {
  step: 1 | 2 | 3 | 4;
  latitude: number | null;
  longitude: number | null;
  addressLine: string;
  landmark: string;
  pincode: string;
  fuzzyLandmark: string;
  fuzzyRadiusMeters: number;
  title: string;
  description: string;
  spotType: SpotType;
  coverage: Coverage;
  vehicleSize: VehicleSize;
  totalSlots: number;
  amenities: string[];
  photos: string[];
  videoUrl: string;
  priceHour: string;
  priceDay: string;
  priceMonth: string;
  availableAllDay: boolean;
  /** 0–6 Sun–Sat, when not allDay */
  activeDays: number[];
  startTime: Date;
  endTime: Date;
  instantBook: boolean;
  reset: () => void;
  hydrate: (partial: Partial<Omit<CreateSpotState, 'reset' | 'hydrate'>>) => void;
};

const defaultStart = new Date();
defaultStart.setHours(8, 0, 0, 0);
const defaultEnd = new Date();
defaultEnd.setHours(20, 0, 0, 0);

const initial: Omit<CreateSpotState, 'reset' | 'hydrate'> = {
  step: 1,
  latitude: null,
  longitude: null,
  addressLine: '',
  landmark: '',
  pincode: '',
  fuzzyLandmark: '',
  fuzzyRadiusMeters: 500,
  title: '',
  description: '',
  spotType: 'car',
  coverage: 'covered',
  vehicleSize: 'any',
  totalSlots: 1,
  amenities: [],
  photos: [],
  videoUrl: '',
  priceHour: '',
  priceDay: '',
  priceMonth: '',
  availableAllDay: false,
  activeDays: [1, 2, 3, 4, 5, 6],
  startTime: defaultStart,
  endTime: defaultEnd,
  instantBook: true,
};

export const useCreateSpotStore = create<CreateSpotState>((set) => ({
  ...initial,
  reset: () => set({ ...initial }),
  hydrate: (partial) => set((s) => ({ ...s, ...partial })),
}));
