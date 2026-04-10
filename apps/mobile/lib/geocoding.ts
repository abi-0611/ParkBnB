const CHENNAI = { lat: 13.0827, lng: 80.2707 };

export type ReverseGeocodeResult = {
  addressLine: string;
  landmark: string;
  pincode: string;
};

/**
 * Mapbox reverse geocode if EXPO_PUBLIC_MAPBOX_TOKEN is set; otherwise Nominatim (rate-limited).
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (token) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1`;
      const res = await fetch(url);
      const json = (await res.json()) as { features?: { place_name?: string }[] };
      const line = json.features?.[0]?.place_name ?? '';
      return { addressLine: line, landmark: '', pincode: extractPincode(line) };
    } catch {
      /* fall through */
    }
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'ParkNear/1.0 (college project)' } });
    const json = (await res.json()) as { display_name?: string; address?: { postcode?: string } };
    const line = json.display_name ?? '';
    return {
      addressLine: line,
      landmark: '',
      pincode: json.address?.postcode ?? extractPincode(line),
    };
  } catch {
    return {
      addressLine: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      landmark: '',
      pincode: '',
    };
  }
}

function extractPincode(text: string): string {
  const m = text.match(/\b6\d{5}\b/);
  return m ? m[0] : '';
}

export function defaultRegion() {
  return {
    latitude: CHENNAI.lat,
    longitude: CHENNAI.lng,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };
}
