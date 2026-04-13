import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Users, AlertTriangle } from "lucide-react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { GlassCard } from "@/components/ui/glass-card";
import { UserRowActions } from "./UserRowActions";

const PER = 20;

function kycVariant(status: string): { label: string; cls: string } {
  if (status === "verified")  return { label: "Verified",  cls: "text-emerald border-emerald/30 bg-emerald/10" };
  if (status === "rejected")  return { label: "Rejected",  cls: "text-danger border-danger/30 bg-danger/10" };
  if (status === "submitted") return { label: "Submitted", cls: "text-warning border-warning/30 bg-warning/10" };
  return { label: status ?? "—", cls: "text-txt-muted border-border-token bg-bg-elevated" };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; role?: string; banned?: string; page?: string; sort?: string };
}) {
  await requireAdmin();
  const supabase = createServerSupabaseClient();

  const q          = (searchParams.q ?? "").trim();
  const roleFilter = searchParams.role ?? "";
  const bannedOnly = searchParams.banned === "1";
  const page       = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const sortKey    = searchParams.sort ?? "joined";

  let sortField: "created_at" | "full_name" | "strike_count" = "created_at";
  let ascending = false;
  if (sortKey === "name")    { sortField = "full_name";    ascending = true; }
  if (sortKey === "strikes") { sortField = "strike_count"; ascending = false; }

  let query = supabase
    .from("users")
    .select(
      "id, full_name, email, phone, role, kyc_status, strike_count, is_banned, avatar_url, created_at",
      { count: "exact" }
    );

  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  if (roleFilter && ["seeker", "owner", "both", "admin"].includes(roleFilter))
    query = query.eq("role", roleFilter);
  if (bannedOnly) query = query.eq("is_banned", true);

  query = query.order(sortField, { ascending, nullsFirst: false });
  const from = (page - 1) * PER;
  query = query.range(from, from + PER - 1);

  const { data: rows, count, error } = await query;

  if (error) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/8 p-4 text-sm text-danger">
        Failed to load users: {error.message}
      </div>
    );
  }

  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER));

  const qs = new URLSearchParams();
  if (q)          qs.set("q", q);
  if (roleFilter) qs.set("role", roleFilter);
  if (bannedOnly) qs.set("banned", "1");
  if (sortKey && sortKey !== "joined") qs.set("sort", sortKey);
  const baseQs = qs.toString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="mt-1 text-sm text-txt-muted">
            {total.toLocaleString()} account{total !== 1 ? "s" : ""} · Search, filter, moderate.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-border-token bg-bg-surface px-3 py-2">
          <Users className="h-4 w-4 text-electric-bright" />
          <span className="text-sm font-semibold text-white">{total}</span>
        </div>
      </div>

      {/* Filter form */}
      <GlassCard variant="elevated" className="p-4" hover={false}>
        <form action="/admin/users" method="get" className="flex flex-wrap items-end gap-3">
          {/* Search */}
          <div className="min-w-[200px] flex-1">
            <label className="mb-1.5 block text-xs font-medium text-txt-muted">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-txt-disabled" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Name, email, phone…"
                className="w-full rounded-xl border border-border-token bg-bg-elevated py-2 pl-8 pr-3 text-sm text-txt-primary outline-none transition-all placeholder:text-txt-disabled focus:border-electric focus:shadow-glow-xs"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-txt-muted">Role</label>
            <select
              name="role"
              defaultValue={roleFilter}
              className="rounded-xl border border-border-token bg-bg-elevated px-3 py-2 text-sm text-txt-primary outline-none focus:border-electric [color-scheme:dark]"
            >
              <option value="">All roles</option>
              <option value="seeker">Seeker</option>
              <option value="owner">Owner</option>
              <option value="both">Both</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-txt-muted">Sort</label>
            <select
              name="sort"
              defaultValue={sortKey}
              className="rounded-xl border border-border-token bg-bg-elevated px-3 py-2 text-sm text-txt-primary outline-none focus:border-electric [color-scheme:dark]"
            >
              <option value="joined">Join date</option>
              <option value="name">Name</option>
              <option value="strikes">Strikes</option>
            </select>
          </div>

          {/* Banned toggle */}
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border-token bg-bg-elevated px-3 py-2">
            <input
              type="checkbox"
              name="banned"
              value="1"
              defaultChecked={bannedOnly}
              className="accent-electric"
            />
            <span className="text-sm text-txt-secondary">Banned only</span>
          </label>

          <button
            type="submit"
            className="rounded-xl bg-electric px-4 py-2 text-sm font-semibold text-white shadow-glow-xs transition-all hover:bg-electric-bright"
          >
            Apply
          </button>
        </form>
      </GlassCard>

      {/* Table */}
      <GlassCard variant="elevated" className="overflow-hidden p-0" hover={false}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border-token">
              <tr>
                {["User", "Email", "Role", "KYC", "Strikes", "Status", "Joined", "Actions"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-txt-muted"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-token">
              {(rows ?? []).map((u) => {
                const kyc = kycVariant(u.kyc_status ?? "");
                const strikes = u.strike_count ?? 0;
                const initials = (u.full_name ?? "?").slice(0, 1).toUpperCase();

                return (
                  <tr
                    key={u.id}
                    className="transition-colors hover:bg-bg-elevated"
                  >
                    {/* User */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="flex items-center gap-2.5 font-medium text-electric-bright hover:underline"
                      >
                        {u.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.avatar_url}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-electric/15 text-xs font-bold text-electric-bright">
                            {initials}
                          </span>
                        )}
                        <span className="max-w-[120px] truncate">{u.full_name ?? "—"}</span>
                      </Link>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-txt-secondary">
                      <span className="max-w-[180px] truncate block">{u.email}</span>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-lg border border-neon/25 bg-neon/8 px-2 py-0.5 text-[10px] font-semibold text-neon-bright">
                        {u.role ?? "—"}
                      </span>
                    </td>

                    {/* KYC */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${kyc.cls}`}
                      >
                        {kyc.label}
                      </span>
                    </td>

                    {/* Strikes */}
                    <td className="px-4 py-3">
                      <span
                        className={
                          strikes >= 3
                            ? "flex items-center gap-1 font-bold text-danger"
                            : "text-txt-secondary"
                        }
                      >
                        {strikes >= 3 && <AlertTriangle className="h-3 w-3" />}
                        {strikes}
                      </span>
                    </td>

                    {/* Banned */}
                    <td className="px-4 py-3">
                      {u.is_banned ? (
                        <span className="inline-flex items-center rounded-lg border border-danger/30 bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">
                          Banned
                        </span>
                      ) : (
                        <span className="text-[10px] text-txt-disabled">Active</span>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-txt-muted">
                      {new Date(u.created_at).toLocaleDateString("en-IN")}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <UserRowActions
                        userId={u.id}
                        currentRole={u.role}
                        isBanned={u.is_banned}
                      />
                    </td>
                  </tr>
                );
              })}

              {(rows ?? []).length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-txt-muted">
                    No users match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-txt-muted">
          Page {page} of {pages} · {total} total
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link
              href={`/admin/users?page=${page - 1}&${baseQs}`}
              className="flex items-center gap-1.5 rounded-xl border border-border-token bg-bg-surface px-3 py-2 text-xs font-medium text-txt-secondary transition-colors hover:border-electric/30 hover:text-electric-bright"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 rounded-xl border border-border-token px-3 py-2 text-xs text-txt-disabled opacity-50">
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </span>
          )}
          {page < pages ? (
            <Link
              href={`/admin/users?page=${page + 1}&${baseQs}`}
              className="flex items-center gap-1.5 rounded-xl border border-border-token bg-bg-surface px-3 py-2 text-xs font-medium text-txt-secondary transition-colors hover:border-electric/30 hover:text-electric-bright"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 rounded-xl border border-border-token px-3 py-2 text-xs text-txt-disabled opacity-50">
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
