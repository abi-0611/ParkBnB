import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdmin } from '@/lib/admin/require-admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();

  return (
    <AdminShell displayName={profile.full_name} email={profile.email}>
      {children}
    </AdminShell>
  );
}
