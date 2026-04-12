"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { MapPin, Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlowButton } from "@/components/ui/glow-button";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { staggerContainer, fadeDown, springs } from "@/lib/motion-variants";
import type { Lang } from "@/i18n/messages";

const navLinks = [
  { label: "Find Parking",    href: "/search"    },
  { label: "List Your Space", href: "/login"     },
  { label: "How It Works",    href: "/#how"      },
  { label: "Owner",           href: "/dashboard" },
] as const;

interface NavbarProps {
  locale: Lang;
}

export function Navbar({ locale }: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 24);
  });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <motion.header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-border-token bg-bg-base/80 backdrop-blur-xl shadow-surface"
            : "bg-transparent"
        )}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0,   opacity: 1  }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* ─── Logo ─── */}
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <motion.div
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-electric shadow-glow-sm"
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={springs.bouncy}
            >
              <MapPin className="h-4 w-4 text-white" strokeWidth={2.5} />
            </motion.div>
            <motion.span
              className="text-sm font-bold tracking-tight text-white"
              whileHover={{ x: 2 }}
              transition={springs.snappy}
            >
              Park<span className="text-gradient">Near</span>
            </motion.span>
          </Link>

          {/* ─── Desktop links ─── */}
          <motion.ul
            className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex"
            variants={staggerContainer(0.06, 0.2)}
            initial="hidden"
            animate="visible"
          >
            {navLinks.map((link) => (
              <motion.li key={link.href} variants={fadeDown}>
                <NavLink href={link.href} active={pathname === link.href}>
                  {link.label}
                </NavLink>
              </motion.li>
            ))}
          </motion.ul>

          {/* ─── Desktop CTA ─── */}
          <motion.div
            className="hidden shrink-0 items-center gap-2 md:flex"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <LanguageSwitcher locale={locale} />
            <Link href="/login">
              <GlowButton variant="glass" size="sm">
                Sign in
              </GlowButton>
            </Link>
            <Link href="/search">
              <GlowButton variant="primary" size="sm">
                Find parking
              </GlowButton>
            </Link>
          </motion.div>

          {/* ─── Mobile: lang switcher + hamburger ─── */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher locale={locale} />
            <motion.button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border-token bg-bg-surface/50 text-txt-secondary backdrop-blur-sm"
              onClick={() => setMobileOpen((o) => !o)}
              whileHover={{ scale: 1.05, borderColor: "rgba(61,123,255,0.4)" }}
              whileTap={{ scale: 0.95 }}
              transition={springs.snappy}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0,   opacity: 1 }}
                    exit={{   rotate:  90,  opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-4 w-4" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="open"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0,  opacity: 1 }}
                    exit={{   rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-4 w-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </nav>
      </motion.header>

      {/* ─── Mobile Drawer ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-bg-base/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{   opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              className="fixed inset-x-0 top-16 z-40 mx-4 overflow-hidden rounded-2xl border border-border-token bg-bg-surface shadow-elevated"
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,   scale: 1     }}
              exit={{   opacity: 0, y: -16,  scale: 0.97  }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="h-px w-full bg-gradient-to-r from-transparent via-electric/40 to-transparent" />

              <motion.ul
                className="flex flex-col p-3"
                variants={staggerContainer(0.05, 0.05)}
                initial="hidden"
                animate="visible"
              >
                {navLinks.map((link) => (
                  <motion.li
                    key={link.href}
                    variants={{
                      hidden:  { opacity: 0, x: -16 },
                      visible: { opacity: 1, x: 0   },
                    }}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                        pathname === link.href
                          ? "bg-electric/10 text-electric-bright"
                          : "text-txt-secondary hover:bg-bg-elevated hover:text-txt-primary"
                      )}
                    >
                      {link.label}
                      <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>

              <div className="border-t border-border-token p-3">
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" className="w-full">
                    <GlowButton variant="glass" size="md" fullWidth>
                      Sign in
                    </GlowButton>
                  </Link>
                  <Link href="/search" className="w-full">
                    <GlowButton variant="primary" size="md" fullWidth>
                      Find parking
                    </GlowButton>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Desktop nav link ───────────────────────────────────────
function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="relative flex items-center px-3 py-2 group">
      <span
        className={cn(
          "whitespace-nowrap text-sm font-medium transition-colors duration-200",
          active ? "text-electric-bright" : "text-txt-secondary group-hover:text-txt-primary"
        )}
      >
        {children}
      </span>
      {active && (
        <motion.span
          className="absolute inset-x-3 bottom-0.5 h-0.5 rounded-full bg-electric shadow-glow-sm"
          layoutId="nav-underline"
          transition={springs.snappy}
        />
      )}
    </Link>
  );
}
