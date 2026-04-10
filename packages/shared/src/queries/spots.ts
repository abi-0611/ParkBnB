import type { SupabaseClient } from '@supabase/supabase-js';

import type { SearchSpotsNearbyParams, SearchSpotsResult, SpotSeekerDetail } from '../types/api';

function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function rowToSearchResult(row: Record<string, unknown>): SearchSpotsResult {
  return {
    id: String(row.id),
    owner_id: String(row.owner_id),
    title: String(row.title ?? ''),
    description: row.description != null ? String(row.description) : null,
    spot_type: row.spot_type as SearchSpotsResult['spot_type'],
    coverage: row.coverage as SearchSpotsResult['coverage'],
    vehicle_size: row.vehicle_size as SearchSpotsResult['vehicle_size'],
    total_slots: Number(row.total_slots ?? 0),
    fuzzy_landmark: String(row.fuzzy_landmark ?? ''),
    fuzzy_radius_meters: Number(row.fuzzy_radius_meters ?? 300),
    price_per_hour: row.price_per_hour as SearchSpotsResult['price_per_hour'],
    price_per_day: row.price_per_day as SearchSpotsResult['price_per_day'],
    price_per_month: row.price_per_month as SearchSpotsResult['price_per_month'],
    is_instant_book: Boolean(row.is_instant_book),
    is_active: Boolean(row.is_active ?? true),
    amenities: row.amenities ?? null,
    photos: Array.isArray(row.photos) ? (row.photos as string[]) : [],
    video_url: row.video_url != null ? String(row.video_url) : null,
    avg_rating: row.avg_rating as SearchSpotsResult['avg_rating'],
    total_reviews: Number(row.total_reviews ?? 0),
    created_at: String(row.created_at ?? ''),
    fuzzy_lat: num(row.fuzzy_lat),
    fuzzy_lng: num(row.fuzzy_lng),
    distance_meters: num(row.distance_meters),
  };
}

export async function searchSpotsNearby(
  client: SupabaseClient,
  params: SearchSpotsNearbyParams
): Promise<{ data: SearchSpotsResult[]; error: Error | null }> {
  const { data, error } = await client.rpc('search_spots_nearby', {
    user_lat: params.lat,
    user_lng: params.lng,
    radius_meters: params.radius_meters ?? 2000,
    spot_filter: params.spot_type ?? null,
    max_price: params.max_price ?? null,
    coverage_filter: params.coverage ?? null,
    min_rating: params.min_rating ?? null,
    instant_book_only: params.instant_book_only ?? null,
    vehicle_size_filter: params.vehicle_size ?? null,
  });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  return { data: rows.map(rowToSearchResult), error: null };
}

export async function getSpotSeekerDetail(
  client: SupabaseClient,
  spotId: string
): Promise<{ data: SpotSeekerDetail | null; error: Error | null }> {
  const { data, error } = await client.rpc('get_spot_seeker_detail', { p_spot_id: spotId });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  if (data == null || typeof data !== 'object') {
    return { data: null, error: null };
  }

  const o = data as Record<string, unknown>;
  const reviewsRaw = o.reviews;
  const reviews: SpotSeekerDetail['reviews'] = Array.isArray(reviewsRaw)
    ? (reviewsRaw as Record<string, unknown>[]).map((r) => ({
        rating: num(r.rating),
        comment: r.comment != null ? String(r.comment) : null,
        created_at: String(r.created_at ?? ''),
        reviewer_name: String(r.reviewer_name ?? ''),
      }))
    : [];

  const detail: SpotSeekerDetail = {
    id: String(o.id),
    owner_id: String(o.owner_id),
    title: String(o.title ?? ''),
    description: o.description != null ? String(o.description) : null,
    spot_type: o.spot_type as SpotSeekerDetail['spot_type'],
    coverage: o.coverage as SpotSeekerDetail['coverage'],
    vehicle_size: o.vehicle_size as SpotSeekerDetail['vehicle_size'],
    total_slots: Number(o.total_slots ?? 0),
    fuzzy_landmark: String(o.fuzzy_landmark ?? ''),
    fuzzy_radius_meters: Number(o.fuzzy_radius_meters ?? 300),
    price_per_hour: o.price_per_hour as SpotSeekerDetail['price_per_hour'],
    price_per_day: o.price_per_day as SpotSeekerDetail['price_per_day'],
    price_per_month: o.price_per_month as SpotSeekerDetail['price_per_month'],
    is_instant_book: Boolean(o.is_instant_book),
    is_active: true,
    amenities: o.amenities ?? null,
    photos: Array.isArray(o.photos) ? (o.photos as string[]).map(String) : [],
    video_url: o.video_url != null ? String(o.video_url) : null,
    avg_rating: o.avg_rating as SpotSeekerDetail['avg_rating'],
    total_reviews: Number(o.total_reviews ?? 0),
    created_at: String(o.created_at ?? ''),
    fuzzy_lat: num(o.fuzzy_lat),
    fuzzy_lng: num(o.fuzzy_lng),
    owner_name: String(o.owner_name ?? ''),
    owner_avatar_url: o.owner_avatar_url != null ? String(o.owner_avatar_url) : null,
    owner_verified: Boolean(o.owner_verified),
    owner_member_since: String(o.owner_member_since ?? ''),
    reviews,
  };

  return { data: detail, error: null };
}
