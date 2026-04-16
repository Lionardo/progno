"use client";

import Link from "next/link";
import { useState } from "react";

import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

interface MobileNavMenuProps {
  isAdmin: boolean;
  userEmail: string | null;
}

export function MobileNavMenu({
  isAdmin,
  userEmail,
}: MobileNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative lg:hidden">
      <button
        aria-controls="mobile-site-nav"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel)] text-[color:var(--color-ink)] transition hover:border-[color:var(--color-mint)]"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="relative h-4 w-5">
          <span
            className={cn(
              "absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition",
              isOpen && "top-[7px] rotate-45",
            )}
          />
          <span
            className={cn(
              "absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition",
              isOpen && "opacity-0",
            )}
          />
          <span
            className={cn(
              "absolute left-0 top-[14px] h-0.5 w-5 rounded-full bg-current transition",
              isOpen && "top-[7px] -rotate-45",
            )}
          />
        </span>
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(20rem,calc(100vw-2.5rem))] rounded-[2rem] border border-[color:var(--color-border-strong)] bg-[color:rgba(9,15,23,0.96)] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          id="mobile-site-nav"
        >
          <nav className="space-y-2">
            <MobileNavLink
              href="/blog"
              label="Blog"
              onNavigate={() => setIsOpen(false)}
            />
            <MobileNavLink
              href="/markets"
              label="Markets"
              onNavigate={() => setIsOpen(false)}
            />
            {isAdmin ? (
              <MobileNavLink
                href="/admin/initiatives"
                label="Admin"
                onNavigate={() => setIsOpen(false)}
              />
            ) : null}
          </nav>

          {userEmail ? (
            <div className="mt-3 border-t border-white/10 pt-3">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                {userEmail}
              </div>
              <form action={signOut} className="mt-3">
                <button
                  className="w-full rounded-[1.4rem] border border-[color:var(--color-border-strong)] px-4 py-3 text-left text-sm text-[color:var(--color-ink)] transition hover:border-[color:var(--color-gold)]"
                  type="submit"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MobileNavLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      className="block rounded-[1.4rem] border border-transparent px-4 py-3 text-sm text-[color:var(--color-ink)] transition hover:border-white/10 hover:bg-white/[0.03]"
      href={href}
      onClick={onNavigate}
    >
      {label}
    </Link>
  );
}
