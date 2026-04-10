-- Sample Chennai spots (requires at least one `public.users` row — sign up locally first, then `supabase db reset`
DO $$
DECLARE
  oid uuid;
BEGIN
  SELECT id INTO oid FROM public.users ORDER BY created_at LIMIT 1;

  IF oid IS NULL THEN
    RAISE NOTICE 'ParkNear seed: skipped (no users). Create an account, then re-run db reset.';
    RETURN;
  END IF;

  INSERT INTO public.spots (
    owner_id,
    title,
    description,
    spot_type,
    coverage,
    vehicle_size,
    total_slots,
    location,
    address_line,
    landmark,
    pincode,
    fuzzy_landmark,
    fuzzy_radius_meters,
    price_per_hour,
    price_per_day,
    amenities,
    photos
  )
  VALUES
    (
      oid,
      'Tower zone covered slot',
      'Quiet residential lane, CCTV on street.',
      'car',
      'covered',
      'sedan',
      1,
      ST_SetSRID(ST_MakePoint(80.2101, 13.0850), 4326)::geography,
      'Private address — revealed after booking',
      'Anna Nagar Tower',
      '600040',
      'Near Anna Nagar Tower',
      450,
      80,
      650,
      '["cctv","shade"]'::jsonb,
      ARRAY[
        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800',
        'https://images.unsplash.com/photo-1625246333195-f898477a6595?w=800'
      ]
    ),
    (
      oid,
      'T. Nagar quick park',
      'Walk to shops; compact hatch friendly.',
      'car',
      'open',
      'hatchback',
      1,
      ST_SetSRID(ST_MakePoint(80.2341, 13.0418), 4326)::geography,
      'Private address — revealed after booking',
      'T. Nagar',
      '600017',
      'Near Pondy Bazaar',
      500,
      90,
      700,
      '["shade"]'::jsonb,
      ARRAY[
        'https://images.unsplash.com/photo-1625246333195-f898477a6595?w=800',
        'https://images.unsplash.com/photo-1495435229379-86d7a860d301?w=800'
      ]
    ),
    (
      oid,
      'Adyar basement bay',
      'Shaded basement; sedan/SUV OK.',
      'both',
      'underground',
      'suv',
      2,
      ST_SetSRID(ST_MakePoint(80.2566, 13.0067), 4326)::geography,
      'Private address — revealed after booking',
      'Adyar',
      '600020',
      'Near Adyar signal',
      400,
      100,
      900,
      '["cctv"]'::jsonb,
      ARRAY[
        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800',
        'https://images.unsplash.com/photo-1529429617124-aee711a7c73?w=800'
      ]
    ),
    (
      oid,
      'Velachery EV-friendly',
      'Open lot; EV charging point nearby.',
      'ev_charging',
      'open',
      'any',
      1,
      ST_SetSRID(ST_MakePoint(80.2209, 12.9815), 4326)::geography,
      'Private address — revealed after booking',
      'Velachery',
      '600042',
      'Near Phoenix Mall',
      600,
      120,
      1100,
      '["ev_charger"]'::jsonb,
      ARRAY[
        'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800',
        'https://images.unsplash.com/photo-1625246333195-f898477a6595?w=800'
      ]
    ),
    (
      oid,
      'OMR IT corridor slot',
      'Office-hours parking; guard on compound.',
      'car',
      'covered',
      'sedan',
      3,
      ST_SetSRID(ST_MakePoint(80.2401, 12.9498), 4326)::geography,
      'Private address — revealed after booking',
      'Sholinganallur',
      '600119',
      'Near OMR food street',
      550,
      85,
      800,
      '["cctv","security"]'::jsonb,
      ARRAY[
        'https://images.unsplash.com/photo-1495435229379-86d7a860d301?w=800',
        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800'
      ]
    ),
    (
      oid,
      'Tambaram bike nook',
      'Compact bike bay; gated colony.',
      'bike',
      'covered',
      'hatchback',
      4,
      ST_SetSRID(ST_MakePoint(80.1277, 12.9249), 4326)::geography,
      'Private address — revealed after booking',
      'Tambaram',
      '600045',
      'Near Tambaram railway',
      350,
      25,
      300,
      '["shade"]'::jsonb,
      ARRAY[
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        'https://images.unsplash.com/photo-1625246333195-f898477a6595?w=800'
      ]
    ),
    (
      oid,
      'Mylapore temple lane',
      'Tight lane; hatch/sedan only.',
      'car',
      'open',
      'sedan',
      1,
      ST_SetSRID(ST_MakePoint(80.2676, 13.0368), 4326)::geography,
      'Private address — revealed after booking',
      'Mylapore',
      '600004',
      'Near Kapaleeshwarar Temple',
      380,
      70,
      600,
      '["shade"]'::jsonb,
      ARRAY[
        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800',
        'https://images.unsplash.com/photo-1495435229379-86d7a860d301?w=800'
      ]
    ),
    (
      oid,
      'Egmore station walk',
      'Open compound; daily commuters.',
      'car',
      'open',
      'any',
      2,
      ST_SetSRID(ST_MakePoint(80.2606, 13.0792), 4326)::geography,
      'Private address — revealed after booking',
      'Egmore',
      '600008',
      'Near Egmore station',
      420,
      95,
      750,
      '["cctv"]'::jsonb,
      ARRAY[
        'https://images.unsplash.com/photo-1625246333195-f898477a6595?w=800',
        'https://images.unsplash.com/photo-1529429617124-aee711a7c73?w=800'
      ]
    ),
    (
      oid,
      'Porur tech park edge',
      'Covered slots; SUV friendly.',
      'car',
      'covered',
      'suv',
      2,
      ST_SetSRID(ST_MakePoint(80.1502, 13.0358), 4326)::geography,
      'Private address — revealed after booking',
      'Porur',
      '600116',
      'Near DLF IT Park',
      500,
      110,
      950,
      '["cctv","shade"]'::jsonb,
      ARRAY[
        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800',
        'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800'
      ]
    ),
    (
      oid,
      'Royapuram harbour side',
      'Open yard; truck-free hours.',
      'both',
      'open',
      'suv',
      1,
      ST_SetSRID(ST_MakePoint(80.2906, 13.1157), 4326)::geography,
      'Private address — revealed after booking',
      'Royapuram',
      '600013',
      'Near harbour approach',
      480,
      75,
      680,
      '["shade"]'::jsonb,
      ARRAY[
        'https://images.unsplash.com/photo-1495435229379-86d7a860d301?w=800',
        'https://images.unsplash.com/photo-1625246333195-f898477a6595?w=800'
      ]
    );

  RAISE NOTICE 'ParkNear seed: inserted sample spots for owner %', oid;
END $$;

-- After signup, promote an account to admin (SQL editor):
-- UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
