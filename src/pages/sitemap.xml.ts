import type { APIRoute } from "astro";
import { docs } from "../data/docs.mjs";
import { settings, absolute } from "../../website.config.mjs";
export const GET: APIRoute = () => {
  const paths = [
    "",
    "features/",
    "demo/",
    "docs/",
    "changelog/",
    "faq/",
    ...docs.map((d) => `docs/${d.slug}/`),
  ];
  const urls =
    settings.url && settings.indexing
      ? paths.map((p) => `<url><loc>${absolute(p)}</loc></url>`).join("")
      : "";
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { "Content-Type": "application/xml" } },
  );
};
