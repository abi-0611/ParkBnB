export type Lang = 'en' | 'ta';

export const messages = {
  en: {
    city: 'Chennai',
    title: 'ParkNear — Your parking spot, a tap away',
    subtitle:
      'Find and book verified parking near you. Owners list spare slots; seekers pay safely and unlock exact location after booking.',
    findParking: 'Find parking',
    listSpace: 'List your space',
    signIn: 'Log in',
    spotsAvailable: 'spots available in Chennai',
    connectSupabase: 'Connect Supabase to show live spot counts.',
  },
  ta: {
    city: 'சென்னை',
    title: 'ParkNear — உங்கள் பார்க்கிங் இடம், ஒரு டாப் தூரத்தில்',
    subtitle:
      'உங்கள் அருகிலுள்ள சரிபார்க்கப்பட்ட பார்க்கிங் இடங்களை தேடி புக் செய்யுங்கள். உரிமையாளர்கள் காலியான இடங்களை பட்டியலிடலாம்.',
    findParking: 'பார்க்கிங் தேடுங்கள்',
    listSpace: 'உங்கள் இடத்தை பட்டியலிடுங்கள்',
    signIn: 'உள்நுழை',
    spotsAvailable: 'இடங்கள் சென்னையில் கிடைக்கின்றன',
    connectSupabase: 'நேரடி எண்ணிக்கைக்கு Supabase இணைக்கவும்.',
  },
} as const;
