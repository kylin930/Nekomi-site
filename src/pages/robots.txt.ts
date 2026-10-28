import type { APIRoute } from "astro";
import { settings, absolute } from "../../website.config.mjs";
export const GET: APIRoute = () =>
  new Response(
    `User-agent: *\nAllow: /\n${settings.url && settings.indexing ? "Sitemap: " + absolute("sitemap.xml") + "\n" : ""}`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
