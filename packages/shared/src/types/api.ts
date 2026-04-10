import type { Booking, SpotPublic, User, Vehicle } from './database';

export type SortBy = 'distance' | 'price' | 'rating' | 'relevance';

export interface SearchSpotsParams {
  lat: number;
  lng: number;
  radius_meters?: number;
  spot_type?: string | null;
  max_price?: number | null;
  vehicle_type?: string | null;
  sort_by?: SortBy;
}

export type SearchSpotsResult = SpotPublic & { distance_meters: number };

export interface CreateBookingParams {
  spot_id: string;
  vehicle_id: string;
  booking_type: Booking['booking_type'];
  start_time: string;
  end_time: string;
}

export interface BookingWithDetails extends Booking {
  spot: SpotPublic;
  seeker: User;
  vehicle: Vehicle | null;
}
