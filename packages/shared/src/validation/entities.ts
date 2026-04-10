import { z } from 'zod';

export const spotType = z.enum(['car', 'bike', 'both', 'ev_charging']);
export const coverage = z.enum(['covered', 'open', 'underground']);
export const vehicleSize = z.enum(['hatchback', 'sedan', 'suv', 'any']);
export const vehicleType = z.enum(['bike', 'car_hatchback', 'car_sedan', 'car_suv', 'ev']);
export const bookingType = z.enum(['hourly', 'daily', 'monthly']);

export const vehicleSchema = z.object({
  vehicle_type: vehicleType,
  number_plate: z.string().min(1).max(20),
  is_default: z.boolean().optional(),
});

export const spotSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional().nullable(),
  spot_type: spotType,
  coverage,
  vehicle_size: vehicleSize.default('any'),
  total_slots: z.number().int().min(1).max(500).default(1),
  address_line: z.string().min(5),
  landmark: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  fuzzy_landmark: z.string().min(3),
  fuzzy_radius_meters: z.number().int().min(50).max(2000).default(500),
  price_per_hour: z.number().nonnegative().optional().nullable(),
  price_per_day: z.number().nonnegative().optional().nullable(),
  price_per_month: z.number().nonnegative().optional().nullable(),
  is_instant_book: z.boolean().default(true),
  amenities: z.array(z.string()).default([]),
  photos: z.array(z.string().min(1)).min(2).max(6),
  video_url: z.string().url().optional().nullable(),
});

export const bookingSchema = z.object({
  spot_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  booking_type: bookingType,
  start_time: z.string().datetime({ offset: true }),
  end_time: z.string().datetime({ offset: true }),
});

export const reviewSchema = z.object({
  booking_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
  review_type: z.enum(['seeker_to_owner', 'owner_to_seeker']),
});
