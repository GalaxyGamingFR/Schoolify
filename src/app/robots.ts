import type { MetadataRoute } from "next";

// Everything past the marketing/legal pages requires sign-in anyway (every
// page does its own auth check — see roadmap.md Phase 0) and redirects
// unauthenticated crawlers straight to /sign-in, so there's nothing useful
// for a search engine to index there. Only the genuinely public pages are
// left crawlable.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/sign-in", "/sign-up", "/faq", "/terms", "/privacy"],
      disallow: [
        "/dashboard",
        "/courses",
        "/calendar",
        "/grades",
        "/messages",
        "/notifications",
        "/moderation",
        "/api/",
      ],
    },
    sitemap: "https://schoolify.tariqkhalif.me/sitemap.xml",
  };
}
