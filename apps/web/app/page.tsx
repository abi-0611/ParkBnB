import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection, FeaturesSection, AreasSection, TrustSection } from "@/components/ContentSections";
import { OwnerCTASection, FinalCTASection, Footer } from "@/components/OwnerCTAAndFooter";
import type { Lang } from "@/i18n/messages";

export default async function Home() {
  const localeCookie = (await cookies()).get("locale")?.value;
  const locale: Lang = localeCookie === "ta" ? "ta" : "en";

  let spotCount: number | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const { count, error } = await supabase
      .from("spots_public")
      .select("*", { count: "exact", head: true });
    if (!error) spotCount = count;
  } catch {
    spotCount = null;
  }

  return (
    <main className="min-h-screen bg-bg-base">
      <HeroSection spotCount={spotCount} locale={locale} />
      <HowItWorksSection />
      <FeaturesSection />
      <AreasSection />
      <TrustSection />
      <OwnerCTASection />
      <FinalCTASection />
      <Footer />
    </main>
  );
}
