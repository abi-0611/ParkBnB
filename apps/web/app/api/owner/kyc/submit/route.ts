import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

type Body = {
  aadhaarDocUrl?: string;
  selfieUrl?: string;
  propertyProofUrl?: string;
};

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  if (!body.aadhaarDocUrl || !body.selfieUrl || !body.propertyProofUrl) {
    return NextResponse.json({ error: "All 3 KYC documents are required" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await admin
    .from("users")
    .update({
      aadhaar_doc_url: body.aadhaarDocUrl,
      selfie_url: body.selfieUrl,
      property_proof_url: body.propertyProofUrl,
      kyc_status: "submitted",
    })
    .eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

