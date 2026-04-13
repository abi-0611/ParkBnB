import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SpotDetailClient } from "./SpotDetailClient";

type PageProps = { params: { id: string } };

export default async function PublicSpotPage({ params }: PageProps) {
  const { id } = params;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_spot_seeker_detail", {
    p_spot_id: id,
  });

  if (error || !data || typeof data !== "object") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-4 text-center">
        <div className="rounded-3xl border border-border-token bg-bg-surface p-12">
          <p className="text-lg font-semibold text-txt-primary">Spot not found</p>
          <p className="mt-2 text-sm text-txt-muted">This parking spot may have been removed.</p>
          <Link
            href="/search"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-electric-bright hover:underline"
          >
            ← Back to search
          </Link>
        </div>
      </main>
    );
  }

  return <SpotDetailClient data={data as Record<string, unknown>} spotId={id} />;
}
