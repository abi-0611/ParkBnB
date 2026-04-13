import Link from "next/link";
import { redirect } from "next/navigation";
import { Car, FileBadge2, Shield } from "lucide-react";
import { auth } from "@/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfilePhoneCard } from "@/components/profile/ProfilePhoneCard";
import { VehicleManager } from "@/components/profile/VehicleManager";
import { GlowButton } from "@/components/ui/glow-button";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const supabase = createServerSupabaseClient();
  const userId = session.user.id;

  const [{ count: vehicleCount }, { data: user }] = await Promise.all([
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("users").select("kyc_status, role, phone").eq("id", userId).maybeSingle(),
  ]);

  const hasVehicle = (vehicleCount ?? 0) > 0;
  const kycStatus = String(user?.kyc_status ?? "pending");
  const kycDone = kycStatus === "submitted" || kycStatus === "verified";

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl space-y-5 px-4 pb-10 pt-24 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile setup</h1>
        <p className="mt-1 text-sm text-txt-muted">
          Complete these details once. They are needed for booking and listing workflows.
        </p>
      </div>

      <section className="grid gap-3 rounded-2xl border border-border-token bg-bg-surface p-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border-token bg-bg-elevated p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <Car className="h-4 w-4 text-electric-bright" />
            Vehicle details
          </p>
          <p className="mt-1 text-xs text-txt-muted">
            Required before checkout.
          </p>
          <p className={`mt-2 text-xs ${hasVehicle ? "text-emerald" : "text-warning"}`}>
            {hasVehicle ? "Completed" : "Missing"}
          </p>
        </div>

        <div className="rounded-xl border border-border-token bg-bg-elevated p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <FileBadge2 className="h-4 w-4 text-electric-bright" />
            ID/KYC documents
          </p>
          <p className="mt-1 text-xs text-txt-muted">
            Needed for listing spots as owner.
          </p>
          <p className={`mt-2 text-xs ${kycDone ? "text-emerald" : "text-warning"}`}>
            {kycDone ? `Status: ${kycStatus}` : "Missing"}
          </p>
          <Link href="/kyc" className="mt-3 inline-block">
            <GlowButton size="sm" variant="outline" icon={<Shield className="h-3.5 w-3.5" />}>
              Open KYC page
            </GlowButton>
          </Link>
        </div>
      </section>

      <ProfilePhoneCard initialPhone={user?.phone ?? null} />

      <VehicleManager />
    </main>
  );
}
