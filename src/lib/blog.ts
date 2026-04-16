import type { ComponentType } from "react";

import WhatIsFutarchyArticle, {
  metadata as whatIsFutarchyMetadata,
} from "@/content/blog/what-is-futarchy.mdx";

export interface BlogArticleMetadata {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readingTime: string;
  eyebrow: string;
}

export interface BlogArticle extends BlogArticleMetadata {
  Content: ComponentType;
}

const blogArticles: BlogArticle[] = [
  {
    ...whatIsFutarchyMetadata,
    Content: WhatIsFutarchyArticle,
  },
];

export function getAllBlogArticles() {
  return [...blogArticles];
}

export function getBlogArticleBySlug(slug: string) {
  return blogArticles.find((article) => article.slug === slug) ?? null;
}
