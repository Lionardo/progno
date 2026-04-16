import type { MDXComponents } from "mdx/types";
import Link from "next/link";

const components: MDXComponents = {
  a: ({ href, children }) => {
    if (typeof href === "string" && href.startsWith("/")) {
      return (
        <Link
          className="text-[color:var(--color-mint)] underline decoration-white/15 underline-offset-4 transition hover:text-[color:var(--color-gold)]"
          href={href}
        >
          {children}
        </Link>
      );
    }

    return (
      <a
        className="text-[color:var(--color-mint)] underline decoration-white/15 underline-offset-4 transition hover:text-[color:var(--color-gold)]"
        href={href}
      >
        {children}
      </a>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] px-5 py-5 text-lg leading-8 text-[color:var(--color-ink)]">
      {children}
    </blockquote>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 font-serif text-3xl leading-tight text-[color:var(--color-ink)] md:text-4xl">
      {children}
    </h2>
  ),
  hr: () => (
    <hr className="my-8 border-0 border-t border-[color:var(--color-border-strong)]" />
  ),
  li: ({ children }) => (
    <li className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-3">
      {children}
    </li>
  ),
  p: ({ children }) => (
    <p className="text-base leading-8 text-[color:var(--color-muted)] md:text-lg">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[color:var(--color-ink)]">
      {children}
    </strong>
  ),
  ul: ({ children }) => <ul className="space-y-3">{children}</ul>,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
