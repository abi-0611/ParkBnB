import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = adminDb();
  const [{ count: vehicleCount }, { data: profile }] = await Promise.all([
    db.from("vehicles").select("id", { count: "exact", head: true }).eq("user_id", userId),
    db.from("users").select("kyc_status").eq("id", userId).maybeSingle(),
  ]);

  const hasVehicle = (vehicleCount ?? 0) > 0;
  const kycStatus = String(profile?.kyc_status ?? "pending");
  const hasKyc = ["submitted", "verified"].includes(kycStatus);

  const total = 2;
  const done = Number(hasVehicle) + Number(hasKyc);
  const percent = Math.round((done / total) * 100);

  return NextResponse.json({
    percent,
    hasVehicle,
    hasKyc,
    kycStatus,
    missing: [
      ...(hasVehicle ? [] : ["vehicle"]),
      ...(hasKyc ? [] : ["kyc"]),
    ],
  });
}
