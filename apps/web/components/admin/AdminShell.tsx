"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, ParkingSquare, CalendarClock,
  AlertTriangle, FileCheck, BarChart2, Settings,
  MapPin, Menu, X, ChevronRight,
} from "lucide-react";

import { SignOutButton } from "@/components/SignOutButton";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/motion-variants";

const NAV = [
  { href: "/admin",            label: "Dashboard",   icon: LayoutDashboard },
  { href: "/admin/users",      label: "Users",       icon: Users           },
  { href: "/admin/spots",      label: "Spots",       icon: ParkingSquare   },
  { href: "/admin/bookings",   label: "Bookings",    icon: CalendarClock   },
  { href: "/admin/disputes",   label: "Disputes",    icon: AlertTriangle   },
  { href: "/admin/kyc",        label: "KYC Review",  icon: FileCheck       },
  { href: "/admin/analytics",  label: "Analytics",   icon: BarChart2       },
  { href: "/admin/settings",   label: "Settings",    icon: Settings        },
] as const;

// ─── Sidebar nav link ────────────────────────────────────────
function SideNavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-electric/15 text-electric-bright"
          : "text-txt-secondary hover:bg-bg-elevated hover:text-txt-primary"
      )}
    >
      {active && (
        <motion.span
          layoutId="admin-nav-active"
          className="absolute inset-0 rounded-xl bg-electric/10 ring-1 ring-electric/25"
          transition={springs.snappy}
        />
      )}
      <Icon
        className={cn(
          "relative h-4 w-4 shrink-0 transition-colors",
          active ? "text-electric-bright" : "text-txt-muted group-hover:text-txt-secondary"
        )}
        strokeWidth={active ? 2 : 1.75}
      />
      <span className="relative">{label}</span>
      {active && (
        <ChevronRight className="relative ml-auto h-3.5 w-3.5 text-electric/60" />
      )}
    </Link>
  );
}

// ─── Sidebar content ─────────────────────────────────────────
function SidebarContent({
  displayName,
  email,
  onNavigate,
}: {
  displayName: string;
  email: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="border-b border-border-token px-4 py-5">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-2.5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-electric shadow-glow-sm">
            <MapPin className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              Park<span className="text-gradient">Near</span>
            </p>
            <p className="text-[10px] text-txt-muted">Admin Console</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map(({ href, label, icon }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <SideNavLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={active}
              onClick={onNavigate}
            />
          );
        })}
      </nav>

      {/* Bottom profile */}
      <div className="border-t border-border-token p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric/10 text-sm font-bold text-electric-bright">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-txt-primary">{displayName}</p>
            <p className="truncate text-[10px] text-txt-muted">{email}</p>
          </div>
        </div>
        <SignOutButton className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border-token bg-bg-surface/50 py-2 text-xs font-medium text-txt-muted transition-colors hover:border-danger/30 hover:text-danger" />
      </div>
    </div>
  );
}

// ─── Shell ───────────────────────────────────────────────────
export function AdminShell({
  displayName,
  email,
  children,
}: {
  displayName: string;
  email: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Get current page label
  const currentPage = NAV.find((n) =>
    n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href)
  );

  return (
    <div className="flex min-h-screen bg-bg-base pt-16 text-txt-primary">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[40vh] bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(61,123,255,0.08)_0%,transparent_65%)]" />

      {/* ─── Desktop Sidebar ─── */}
      <aside className="fixed bottom-0 left-0 top-16 z-40 hidden w-56 shrink-0 flex-col border-r border-border-token bg-bg-surface/80 backdrop-blur-xl md:flex">
        <SidebarContent displayName={displayName} email={email} />
      </aside>

      {/* ─── Mobile drawer backdrop ─── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[55] bg-bg-base/70 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── Mobile drawer panel ─── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-y-0 left-0 z-[60] w-64 border-r border-border-token bg-bg-surface shadow-elevated md:hidden"
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-txt-muted hover:text-txt-primary"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent
              displayName={displayName}
              email={email}
              onNavigate={() => setOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main content ─── */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-56">
        {/* Top bar */}
        <motion.header
          className="sticky top-16 z-30 flex h-14 items-center gap-3 border-b border-border-token bg-bg-base/80 px-4 backdrop-blur-xl sm:px-6"
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-token text-txt-muted hover:text-txt-primary md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Breadcrumb */}
          <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
            <span className="hidden text-txt-muted md:inline">Admin</span>
            {currentPage && (
              <>
                <ChevronRight className="hidden h-3.5 w-3.5 text-txt-disabled md:inline" />
                <span className="font-medium text-txt-primary">{currentPage.label}</span>
              </>
            )}
          </div>

          {/* Right — profile chip */}
          <div className="hidden items-center gap-3 md:flex">
            <div className="text-right text-xs">
              <p className="font-medium text-txt-primary">{displayName}</p>
              <p className="text-txt-muted">{email}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric/10 text-xs font-bold text-electric-bright">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </motion.header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
