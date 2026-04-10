import type { SupabaseClient } from '@supabase/supabase-js';

import type { Booking, BookingType } from '../types/database';

export async function createBookingRpc(
  client: SupabaseClient,
  params: {
    spot_id: string;
    vehicle_id: string;
    booking_type: BookingType;
    start_time: string;
    end_time: string;
  }
): Promise<{ data: string | null; error: Error | null }> {
  const { data, error } = await client.rpc('create_booking', {
    p_spot_id: params.spot_id,
    p_vehicle_id: params.vehicle_id,
    p_booking_type: params.booking_type,
    p_start: params.start_time,
    p_end: params.end_time,
  });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as string, error: null };
}

export async function checkInRpc(
  client: SupabaseClient,
  bookingId: string,
  lat: number,
  lng: number
): Promise<{ error: Error | null }> {
  const { error } = await client.rpc('check_in_booking', {
    p_booking_id: bookingId,
    p_lat: lat,
    p_lng: lng,
  });
  return { error: error ? new Error(error.message) : null };
}

export async function checkOutRpc(client: SupabaseClient, bookingId: string): Promise<{ error: Error | null }> {
  const { error } = await client.rpc('check_out_booking', { p_booking_id: bookingId });
  return { error: error ? new Error(error.message) : null };
}

export async function getSpotCoordinatesForSeeker(
  client: SupabaseClient,
  spotId: string
): Promise<{ lat: number; lng: number } | null> {
  const { data, error } = await client.rpc('get_spot_coordinates_for_seeker', { p_spot_id: spotId });
  if (error || data == null) return null;
  const row = Array.isArray(data) ? (data[0] as { lat: number; lng: number }) : (data as { lat: number; lng: number });
  if (row == null || row.lat == null || row.lng == null) return null;
  return { lat: Number(row.lat), lng: Number(row.lng) };
}

export type BookingSeekerRow = Booking & {
  spots?: {
    id: string;
    title: string;
    photos: string[] | null;
    address_line?: string;
    landmark?: string | null;
  } | null;
  vehicles?: { id: string; vehicle_type: string; number_plate: string } | null;
};

export async function fetchSeekerBookings(client: SupabaseClient): Promise<{
  data: BookingSeekerRow[];
  error: Error | null;
}> {
  const { data, error } = await client
    .from('bookings')
    .select(
      `
      *,
      spots ( id, title, photos, address_line, landmark ),
      vehicles ( id, vehicle_type, number_plate )
    `
    )
    .order('start_time', { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: (data ?? []) as BookingSeekerRow[], error: null };
}
