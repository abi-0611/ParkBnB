import Link from 'next/link';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/require-admin';

import { UserRowActions } from './UserRowActions';

const PER = 20;

function badgeClass(k: string) {
  if (k === 'verified') return 'bg-emerald-100 text-emerald-800';
  if (k === 'rejected') return 'bg-rose-100 text-rose-800';
  if (k === 'submitted') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-700';
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; role?: string; banned?: string; page?: string; sort?: string };
}) {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();

  const q = (searchParams.q ?? '').trim();
  const roleFilter = searchParams.role ?? '';
  const bannedOnly = searchParams.banned === '1';
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const sortKey = searchParams.sort ?? 'joined';
  let sortField: 'created_at' | 'full_name' | 'strike_count' = 'created_at';
  let ascending = false;
  if (sortKey === 'name') {
    sortField = 'full_name';
    ascending = true;
  } else if (sortKey === 'strikes') {
    sortField = 'strike_count';
    ascending = false;
  }

  let query = supabase
    .from('users')
    .select('id, full_name, email, phone, role, kyc_status, strike_count, is_banned, avatar_url, created_at', {
      count: 'exact',
    });

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }
  if (roleFilter && ['seeker', 'owner', 'both', 'admin'].includes(roleFilter)) {
    query = query.eq('role', roleFilter);
  }
  if (bannedOnly) {
    query = query.eq('is_banned', true);
  }

  query = query.order(sortField, { ascending, nullsFirst: false });
  const from = (page - 1) * PER;
  const to = from + PER - 1;
  query = query.range(from, to);

  const { data: rows, count, error } = await query;

  if (error) {
    return <p className="text-rose-600">Failed to load users: {error.message}</p>;
  }

  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER));

  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  if (roleFilter) qs.set('role', roleFilter);
  if (bannedOnly) qs.set('banned', '1');
  if (sortKey && sortKey !== 'joined') qs.set('sort', sortKey);
  const baseQs = qs.toString();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="text-sm text-slate-600">Search, filter, and moderate accounts.</p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4" action="/admin/users" method="get">
        <div>
          <label className="block text-xs font-medium text-slate-600">Search</label>
          <input
            name="q"
            defaultValue={q}
            placeholder="Name, email, phone"
            className="mt-1 w-56 rounded border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Role</label>
          <select name="role" defaultValue={roleFilter} className="mt-1 rounded border border-slate-300 px-3 py-1.5 text-sm">
            <option value="">All</option>
            <option value="seeker">seeker</option>
            <option value="owner">owner</option>
            <option value="both">both</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input type="checkbox" id="banned" name="banned" value="1" defaultChecked={bannedOnly} />
          <label htmlFor="banned" className="text-sm text-slate-700">
            Banned only
          </label>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Sort</label>
          <select name="sort" defaultValue={sortKey} className="mt-1 rounded border border-slate-300 px-3 py-1.5 text-sm">
            <option value="joined">Join date</option>
            <option value="name">Name</option>
            <option value="strikes">Strikes</option>
          </select>
        </div>
        <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Apply
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">KYC</th>
              <th className="px-4 py-3">Strikes</th>
              <th className="px-4 py-3">Banned</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(rows ?? []).map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.id}`} className="flex items-center gap-2 font-medium text-sky-700 hover:underline">
                    {u.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold">
                        {(u.full_name ?? '?').slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    {u.full_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass(u.kyc_status)}`}>{u.kyc_status}</span>
                </td>
                <td className={`px-4 py-3 font-medium ${(u.strike_count ?? 0) >= 3 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {u.strike_count ?? 0}
                </td>
                <td className="px-4 py-3">{u.is_banned ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-slate-600">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <UserRowActions userId={u.id} currentRole={u.role} isBanned={u.is_banned} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span>
          Page {page} of {pages} ({total} users)
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link
              className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-50"
              href={`/admin/users?${baseQs ? `${baseQs}&` : ''}page=${page - 1}`}
            >
              Previous
            </Link>
          ) : null}
          {page < pages ? (
            <Link
              className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-50"
              href={`/admin/users?${baseQs ? `${baseQs}&` : ''}page=${page + 1}`}
            >
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
