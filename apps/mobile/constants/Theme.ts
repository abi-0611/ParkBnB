// ═══════════════════════════════════════════════════════════
//  ParkNear Mobile Design Tokens
//  Reference: dark navy-black + electric blue neon aesthetic
// ═══════════════════════════════════════════════════════════

export const Colors = {
  // ─── Backgrounds ───────────────────────────────────────────
  bgBase:     '#05050E',
  bgSurface:  '#090917',
  bgElevated: '#0E0E22',
  bgOverlay:  '#13132E',

  // ─── Electric blue (primary) ───────────────────────────────
  electric:       '#3D7BFF',
  electricBright: '#5C96FF',
  electricDim:    '#2558CC',

  // ─── Neon cyan-blue (glows, map) ───────────────────────────
  neon:       '#00AAFF',
  neonBright: '#33BBFF',

  // ─── Brand emerald (kept from original) ────────────────────
  emerald:       '#10B981',
  emeraldBright: '#34D399',

  // ─── Text scale ────────────────────────────────────────────
  textPrimary:   '#FFFFFF',
  textSecondary: '#8B9FD4',
  textMuted:     '#4E5B87',
  textDisabled:  '#2D3558',

  // ─── Borders ───────────────────────────────────────────────
  border:       'rgba(99, 126, 255, 0.12)',
  borderBright: 'rgba(99, 126, 255, 0.30)',
  borderSubtle: 'rgba(99, 126, 255, 0.06)',

  // ─── Status ────────────────────────────────────────────────
  success: '#10B981',
  warning: '#F59E0B',
  danger:  '#EF4444',

  // ─── Map customization ─────────────────────────────────────
  mapMarkerBg:     '#3D7BFF',
  mapCircleFill:   'rgba(61, 123, 255, 0.12)',
  mapCircleStroke: 'rgba(61, 123, 255, 0.40)',
  mapSelectedFill: 'rgba(0, 170, 255, 0.20)',
  mapSelectedStroke: 'rgba(0, 170, 255, 0.60)',
} as const;

// ─── Typography ────────────────────────────────────────────
export const Typography = {
  xs:   { fontSize: 11, lineHeight: 16 },
  sm:   { fontSize: 13, lineHeight: 18 },
  base: { fontSize: 15, lineHeight: 22 },
  lg:   { fontSize: 17, lineHeight: 24 },
  xl:   { fontSize: 20, lineHeight: 28 },
  '2xl':{ fontSize: 24, lineHeight: 32 },
  '3xl':{ fontSize: 30, lineHeight: 38 },
} as const;

// ─── Radii ─────────────────────────────────────────────────
export const Radii = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  full: 999,
} as const;

// ─── Spacing ───────────────────────────────────────────────
export const Space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

// ─── Shadows ───────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor: '#3D7BFF',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  md: {
    shadowColor: '#3D7BFF',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.50,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  neon: {
    shadowColor: '#00AAFF',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
} as const;

// ─── Easing for Reanimated ─────────────────────────────────
export const Easing = {
  spring: { damping: 24, stiffness: 300, mass: 0.8 },
  snappy: { damping: 24, stiffness: 300, mass: 0.8 },
  gentle: { damping: 20, stiffness: 120, mass: 1.0 },
  bouncy: { damping: 18, stiffness: 400, mass: 0.7 },
} as const;

// ─── Map style (dark neon) ─────────────────────────────────
export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#05050E' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4E5B87' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#05050E' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#0E0E22' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#4E5B87' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#8B9FD4' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#4E5B87' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#090917' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#4E5B87' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#0E0E22' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a3a' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#4E5B87' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#0A0A2A' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1e3a5f' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#3D7BFF' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#090917' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#4E5B87' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#030310' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#2D3558' }] },
];
