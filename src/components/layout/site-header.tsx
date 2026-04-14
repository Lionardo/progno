import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  isAdmin: boolean;
  userEmail: string | null;
}

export function SiteHeader({ isAdmin, userEmail }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[color:rgba(9,15,23,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-8">
        <Link className="group flex items-center gap-3" href="/">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel)] text-sm font-semibold text-[color:var(--color-mint)]">
            PR
          </div>
          <div>
            <div className="font-serif text-xl text-[color:var(--color-ink)]">
              Progno
            </div>
            <div className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-muted)]">
              Swiss Shadow Futarchy
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-3 text-sm text-[color:var(--color-muted)]">
          <Link
            className="rounded-full border border-transparent px-4 py-2 text-[color:var(--color-ink)] transition hover:border-white/10"
            href="/markets"
            style={{ color: "var(--color-ink)" }}
          >
            Markets
          </Link>
          {isAdmin ? (
            <Link
              className="rounded-full border border-[color:var(--color-border-strong)] px-4 py-2 text-[color:var(--color-ink)] transition hover:border-[color:var(--color-mint)]"
              href="/admin/initiatives"
            >
              Admin
            </Link>
          ) : null}
          {userEmail ? (
            <div className="hidden items-center gap-3 lg:flex">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                {userEmail}
              </div>
              <form action={signOut}>
                <button
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition",
                    "border-[color:var(--color-border-strong)] text-[color:var(--color-ink)] hover:border-[color:var(--color-gold)]",
                  )}
                  type="submit"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link
              className="min-w-20 rounded-full border border-[color:var(--color-border-strong)] bg-[color:var(--color-mint)] px-4 py-2 font-medium text-white transition hover:bg-[color:var(--color-gold)]"
              href="/login"
              style={{ color: "#fff" }}
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
