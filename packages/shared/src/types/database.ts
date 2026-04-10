/** Mirrors `public` schema — keep in sync with Supabase migrations */

export type UserRole = 'seeker' | 'owner' | 'both' | 'admin';
export type KycStatus = 'pending' | 'submitted' | 'verified' | 'rejected';
export type VehicleType = 'bike' | 'car_hatchback' | 'car_sedan' | 'car_suv' | 'ev';
export type SpotType = 'car' | 'bike' | 'both' | 'ev_charging';
export type Coverage = 'covered' | 'open' | 'underground';
export type VehicleSize = 'hatchback' | 'sedan' | 'suv' | 'any';
export type BookingType = 'hourly' | 'daily' | 'monthly';
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'active'
  | 'completed'
  | 'cancelled_by_seeker'
  | 'cancelled_by_owner'
  | 'no_show'
  | 'disputed';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type ReviewType = 'seeker_to_owner' | 'owner_to_seeker';
export type TransactionType = 'payment' | 'refund' | 'payout' | 'penalty';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface User {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  is_verified: boolean;
  kyc_status: KycStatus;
  aadhaar_doc_url: string | null;
  selfie_url: string | null;
  property_proof_url?: string | null;
  seeker_rating?: string | number;
  owner_rating?: string | number;
  emergency_contacts?: EmergencyContact[] | unknown;
  strike_count: number;
  is_banned: boolean;
  preferred_language: string;
  push_token?: string | null;
  notification_preferences?: Record<string, boolean> | unknown;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  vehicle_type: VehicleType;
  number_plate: string;
  rc_doc_url: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Spot {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  spot_type: SpotType;
  coverage: Coverage;
  vehicle_size: VehicleSize;
  total_slots: number;
  location: unknown;
  address_line: string;
  landmark: string | null;
  city: string;
  pincode: string | null;
  fuzzy_landmark: string;
  fuzzy_radius_meters: number;
  price_per_hour: string | number | null;
  price_per_day: string | number | null;
  price_per_month: string | number | null;
  is_instant_book: boolean;
  is_active: boolean;
  is_featured: boolean;
  amenities: unknown;
  photos: string[];
  video_url: string | null;
  avg_rating: string | number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

/** `spots_public` view — no exact address */
export interface SpotPublic {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  spot_type: SpotType;
  coverage: Coverage;
  vehicle_size: VehicleSize;
  total_slots: number;
  fuzzy_landmark: string;
  fuzzy_radius_meters: number;
  price_per_hour: string | number | null;
  price_per_day: string | number | null;
  price_per_month: string | number | null;
  is_instant_book: boolean;
  is_active: boolean;
  amenities: unknown;
  photos: string[];
  video_url: string | null;
  avg_rating: string | number;
  total_reviews: number;
  created_at: string;
  fuzzy_lat: number;
  fuzzy_lng: number;
}

export interface Availability {
  id: string;
  spot_id: string;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  specific_date: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  seeker_id: string;
  spot_id: string;
  vehicle_id: string | null;
  booking_type: BookingType;
  start_time: string;
  end_time: string;
  base_price: string | number;
  service_fee: string | number;
  total_price: string | number;
  owner_payout: string | number;
  status: BookingStatus;
  gate_otp: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  payment_id: string | null;
  payment_status: PaymentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  refund_amount: string | number | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  spot_id: string;
  rating: number;
  comment: string | null;
  tags?: string[];
  review_type: ReviewType;
  created_at: string;
}

export type DisputeStatus = 'open' | 'under_review' | 'resolved_for_raiser' | 'resolved_for_other' | 'dismissed';

export interface Dispute {
  id: string;
  booking_id: string;
  raised_by: string;
  against_user: string;
  reason: string;
  description: string;
  evidence_photos: string[];
  status: DisputeStatus;
  admin_notes: string | null;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  booking_id: string | null;
  user_id: string;
  type: TransactionType;
  amount: string | number;
  status: TransactionStatus;
  razorpay_ref: string | null;
  created_at: string;
}
