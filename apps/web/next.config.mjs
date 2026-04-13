/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google OAuth avatars
      { protocol: "https", hostname: "*.supabase.co" },             // Supabase storage
    ],
  },

  // ── Security headers ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Stop clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Force HTTPS (2-year max-age)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Referrer — send only origin
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Legacy XSS protection for older browsers
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Permissions — disable unused browser APIs
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
          },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js chunks + Razorpay checkout SDK
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.razorpay.com",
              // Next.js inline styles
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Images
              "img-src 'self' blob: data: https://*.supabase.co https://images.unsplash.com https://lh3.googleusercontent.com https://api.mapbox.com https://*.mapbox.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // API + WebSocket connections
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com https://tiles.mapbox.com https://api.razorpay.com https://lumberjack.razorpay.com https://nominatim.openstreetmap.org",
              // Razorpay checkout + OpenStreetMap preview iframe
              "frame-src https://api.razorpay.com https://checkout.razorpay.com https://www.openstreetmap.org https://openstreetmap.org",
              // Web workers (required by mapbox-gl)
              "worker-src 'self' blob:",
              // Media (spot photos/videos)
              "media-src 'self' https://*.supabase.co",
              // No plugins
              "object-src 'none'",
              // Restrict base URI
              "base-uri 'self'",
              // Restrict form submissions
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
