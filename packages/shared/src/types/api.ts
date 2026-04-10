import type { Booking, SpotPublic, User, Vehicle } from './database';

export type SortBy = 'distance' | 'price' | 'rating' | 'relevance';

/** Client-side sort after RPC (nearest is default server order). */
export type SeekerSortKey = 'distance' | 'price_low' | 'price_high' | 'rating';

export interface SearchSpotsParams {
  lat: number;
  lng: number;
  radius_meters?: number;
  spot_type?: string | null;
  max_price?: number | null;
  vehicle_type?: string | null;
  sort_by?: SortBy;
}

/** Parameters for `search_spots_nearby` RPC (server-side filters). */
export interface SearchSpotsNearbyParams {
  lat: number;
  lng: number;
  radius_meters?: number;
  spot_type?: string | null;
  max_price?: number | null;
  coverage?: string | null;
  min_rating?: number | null;
  instant_book_only?: boolean | null;
  vehicle_size?: string | null;
}

export type SearchSpotsResult = SpotPublic & { distance_meters: number };

export interface SeekerSpotReview {
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string;
}

export interface SpotSeekerDetail extends SpotPublic {
  owner_name: string;
  owner_avatar_url: string | null;
  owner_verified: boolean;
  owner_member_since: string;
  reviews: SeekerSpotReview[];
}

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
