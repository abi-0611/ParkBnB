import { SpotForm } from '@/components/owner/SpotForm';
import Link from 'next/link';

export default function EditSpotPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-sky-400">Edit spot</h1>
        <Link href="/dashboard" className="text-sm text-sky-400 hover:underline">
          Dashboard
        </Link>
      </div>
      <SpotForm mode="edit" spotId={params.id} />
    </main>
  );
}
