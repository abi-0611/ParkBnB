/** Random point within `radiusMeters` of (lat, lng) — WGS84 approximation for display fuzzing */
export function fuzzyLocation(lat: number, lng: number, radiusMeters: number): { lat: number; lng: number } {
  const r = radiusMeters;
  const u = Math.random();
  const v = Math.random();
  const w = r * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const dx = w * Math.cos(t);
  const dy = w * Math.sin(t);
  const latOffset = dy / 111_320;
  const lngOffset = dx / (111_320 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + latOffset, lng: lng + lngOffset };
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function getDistanceDescription(meters: number, landmark: string): string {
  const d = formatDistance(meters);
  return `~${d} near ${landmark}`;
}
