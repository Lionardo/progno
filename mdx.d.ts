declare module "*.mdx" {
  import type { ComponentType } from "react";

  const MDXContent: ComponentType;
  export const metadata: {
    slug: string;
    title: string;
    description: string;
    publishedAt: string;
    readingTime: string;
    eyebrow: string;
  };

  export default MDXContent;
}
