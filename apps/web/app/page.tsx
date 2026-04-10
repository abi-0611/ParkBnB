import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';

import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { messages, type Lang } from '@/i18n/messages';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function Home() {
  const localeCookie = (await cookies()).get('locale')?.value;
  const locale: Lang = localeCookie === 'ta' ? 'ta' : 'en';
  const m = messages[locale];
  const ta = locale === 'ta';
  const t = {
    howItWorks: ta ? 'இது எப்படி வேலை செய்கிறது' : 'How It Works',
    search: ta ? 'தேடுங்கள்' : 'Search',
    bookPay: ta ? 'புக் செய்து கட்டணம் செலுத்துங்கள்' : 'Book & Pay',
    park: ta ? 'கவலையின்றி பார்க்க் செய்யுங்கள்' : 'Park',
    ownerTitle: ta ? 'காலியாக இருக்கும் பார்க்கிங்கை வருமானமாக மாற்றுங்கள்' : 'Turn Your Empty Parking Into Income',
    ownerBody: ta
      ? 'நேரத்திற்கு ஏற்றதாக உங்கள் இடத்தை நிர்வகியுங்கள். நீங்கள் விரும்பும் நேரத்தில் மட்டுமே பட்டியலிடலாம்.'
      : 'List your spare parking space, set your schedule, and earn extra monthly income.',
    features: ta ? 'அம்சங்கள்' : 'Features',
    areas: ta ? 'நாங்கள் கவர் செய்யும் பகுதிகள்' : 'Areas We Cover',
    trust: ta ? 'நம்பிக்கை & பாதுகாப்பு' : 'Trust & Safety',
    download: ta ? 'தொடங்க தயாரா?' : 'Ready To Get Started?',
    webApp: ta ? 'அல்லது வெப் ஆப்பை பயன்படுத்துங்கள்' : 'Or use the web app',
    footerNote: ta ? 'கல்லூரி திட்டமாக உருவாக்கப்பட்டது.' : 'Made as a college project.',
  };

  let spotCount: number | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const { count, error } = await supabase.from('spots_public').select('*', { count: 'exact', head: true });
    if (!error) spotCount = count;
  } catch {
    spotCount = null;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-8">
          <div className="mb-10 flex justify-end">
            <LanguageSwitcher locale={locale} />
          </div>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-sky-400">{m.city}</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{m.title}</h1>
              <p className="mt-6 max-w-xl text-lg text-slate-300">{m.subtitle}</p>
              <p className="mt-6 text-sm text-slate-400">
                {spotCount !== null ? (
                  <>
                    <span className="font-semibold text-emerald-400">{spotCount}+</span> {m.spotsAvailable}
                  </>
                ) : (
                  m.connectSupabase
                )}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/search"
                  className="rounded-full bg-emerald-500 px-7 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  {m.findParking}
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-slate-600 px-7 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
                >
                  {m.listSpace}
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-sky-500/15 blur-3xl" />
              <Image
                src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80&auto=format&fit=crop"
                alt="Chennai city roads"
                width={1200}
                height={800}
                className="relative h-[320px] w-full rounded-3xl border border-slate-700 object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold">{t.howItWorks}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { k: '1', title: t.search, body: ta ? 'உங்கள் இடத்துக்கு அருகில் பார்க்கிங் கண்டுபிடிக்கவும்.' : 'Find parking near your destination.' },
            { k: '2', title: t.bookPay, body: ta ? 'உடனடி கட்டணத்துடன் இடத்தை பாதுகாப்பாக புக் செய்யுங்கள்.' : 'Secure your spot with instant payment.' },
            { k: '3', title: t.park, body: ta ? 'சரியான முகவரியை பெற்று எளிதாக பார்க்க் செய்யுங்கள்.' : 'Get exact location and park stress-free.' },
          ].map((item) => (
            <article key={item.k} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs font-bold text-sky-400">STEP {item.k}</p>
              <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-semibold">{t.ownerTitle}</h2>
            <p className="mt-3 text-slate-300">{t.ownerBody}</p>
            <Link href="/login" className="mt-6 inline-block rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-slate-950">
              {m.listSpace}
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-950 p-6">
            <ul className="space-y-3 text-sm text-slate-200">
              <li>• {ta ? 'வாராந்திர வருமானம்' : 'Weekly passive income'}</li>
              <li>• {ta ? 'நெகிழ்வான அட்டவணை' : 'Flexible schedule controls'}</li>
              <li>• {ta ? 'எளிய மேலாண்மை' : 'Simple listing management'}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold">{t.features}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(ta
            ? ['பாதுகாப்பான கட்டணம்', 'நேரடி கிடைக்கும் நிலை', 'சரிபார்க்கப்பட்ட பயனர்கள்', 'In-app வழிகாட்டல்']
            : ['Secure payments', 'Real-time availability', 'Verified users', 'In-app navigation']
          ).map((f) => (
            <div key={f} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200">
              {f}
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-semibold">{t.areas}</h2>
          <p className="mt-3 text-slate-300">
            Anna Nagar, T. Nagar, OMR, Velachery, Adyar, Porur, Tambaram, Perungudi
          </p>
          <div className="mt-6 h-44 rounded-2xl border border-slate-700 bg-gradient-to-r from-sky-900/40 to-emerald-900/30" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold">{t.trust}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(ta
            ? ['KYC சரிபார்ப்பு', 'இருவழி விமர்சனங்கள்', 'SOS உதவி', 'தகராறு தீர்வு']
            : ['KYC verification', 'Two-way reviews', 'SOS emergency', 'Dispute resolution']
          ).map((x) => (
            <div key={x} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200">
              {x}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/70">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="text-3xl font-semibold">{t.download}</h2>
          <p className="mt-3 text-slate-300">{t.webApp}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/search" className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950">
              {m.findParking}
            </Link>
            <Link href="/login" className="rounded-full border border-slate-600 px-6 py-2.5 text-sm font-semibold text-slate-100">
              {m.signIn}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>ParkNear</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-slate-200">
              About
            </Link>
            <Link href="/login" className="hover:text-slate-200">
              Privacy
            </Link>
            <Link href="/login" className="hover:text-slate-200">
              Terms
            </Link>
          </div>
          <p>{t.footerNote}</p>
        </div>
      </footer>
    </main>
  );
}
