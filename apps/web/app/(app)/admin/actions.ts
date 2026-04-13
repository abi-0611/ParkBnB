'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/admin/require-admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const ROLES = new Set(['seeker', 'owner', 'both', 'admin']);

export async function adminUpdateUserRole(userId: string, role: string) {
  await requireAdmin();
  if (!ROLES.has(role)) throw new Error('Invalid role');
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('users').update({ role }).eq('id', userId);
  if (error) throw error;
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
}

export async function adminResetStrikes(userId: string) {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('users').update({ strike_count: 0 }).eq('id', userId);
  if (error) throw error;
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
}

export async function adminSetBanned(userId: string, banned: boolean, reason: string | null) {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from('users')
    .update({ is_banned: banned, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
  void reason;
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
}

export async function adminDeleteUser(userId: string) {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw error;
  revalidatePath('/admin/users');
}

export async function adminSetKyc(userId: string, status: 'verified' | 'rejected', reason?: string) {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const patch: Record<string, unknown> = {
    kyc_status: status,
    updated_at: new Date().toISOString(),
  };
  if (status === 'verified') {
    patch.is_verified = true;
  }
  if (status === 'rejected' && reason) {
    void reason;
  }
  const { error } = await supabase.from('users').update(patch).eq('id', userId);
  if (error) throw error;
  revalidatePath('/admin/kyc');
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
}

export async function adminSetSpotActive(spotId: string, isActive: boolean) {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('spots').update({ is_active: isActive }).eq('id', spotId);
  if (error) throw error;
  revalidatePath('/admin/spots');
}

export async function adminSetSpotFeatured(spotId: string, isFeatured: boolean) {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('spots').update({ is_featured: isFeatured }).eq('id', spotId);
  if (error) throw error;
  revalidatePath('/admin/spots');
}

export async function adminDeleteSpot(spotId: string) {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('spots').delete().eq('id', spotId);
  if (error) throw error;
  revalidatePath('/admin/spots');
}

export async function adminForceCancelBooking(
  bookingId: string,
  opts: { refundAmount: number | null; reason: string }
) {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const patch: Record<string, unknown> = {
    status: 'cancelled_by_owner',
    cancelled_at: new Date().toISOString(),
    cancellation_reason: `[Admin] ${opts.reason}`,
    refund_amount: opts.refundAmount,
    updated_at: new Date().toISOString(),
  };
  if (opts.refundAmount != null && opts.refundAmount > 0) {
    patch.payment_status = 'refunded';
  }
  const { error } = await supabase.from('bookings').update(patch).eq('id', bookingId);
  if (error) throw error;
  revalidatePath('/admin/bookings');
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function adminOverrideBookingStatus(bookingId: string, status: string) {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', bookingId);
  if (error) throw error;
  revalidatePath('/admin/bookings');
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function adminResolveDispute(
  disputeId: string,
  payload: {
    status: 'resolved_for_raiser' | 'resolved_for_other' | 'dismissed';
    adminNotes: string;
    resolution: string;
    strikeUserId: string | null;
  }
) {
  await requireAdmin();
  const supabase = createServerSupabaseClient();

  const { error: dErr } = await supabase
    .from('disputes')
    .update({
      status: payload.status,
      admin_notes: payload.adminNotes,
      resolution: payload.resolution,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', disputeId);
  if (dErr) throw dErr;

  if (payload.strikeUserId) {
    const { data: u } = await supabase.from('users').select('strike_count').eq('id', payload.strikeUserId).single();
    const next = (u?.strike_count ?? 0) + 1;
    await supabase.from('users').update({ strike_count: next }).eq('id', payload.strikeUserId);
  }

  revalidatePath('/admin/disputes');
  revalidatePath(`/admin/disputes/${disputeId}`);
}
