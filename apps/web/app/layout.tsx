import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";

import { AuthProvider } from "@/components/AuthProvider";
import { Navbar } from "@/components/Navbar";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ParkNear — Your parking spot, a tap away",
  description: "Peer-to-peer parking in Chennai. Book verified spots near you.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = (await cookies()).get("locale")?.value === "ta" ? "ta" : "en";

  return (
    <html lang={locale} className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg-base`}>
        <AuthProvider>
          <Navbar locale={locale} />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
