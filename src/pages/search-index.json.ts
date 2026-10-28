import type { APIRoute } from "astro";
import { docs, renderSource } from "../lib/content.mjs";
import { withBase } from "../../website.config.mjs";
export const GET: APIRoute = async () => {
  const entries: {
    title: string;
    section: string;
    text: string;
    url: string;
  }[] = [];
  for (const doc of docs) {
    const { html } = await renderSource(doc.source);
    const parts = html.split(/(?=<h2[ >])/);
    for (const part of parts) {
      const id = part.match(/^<h2 id="([^"]+)"/); // Astro heading slugs are used verbatim.
      const heading = part.match(/^<h2[^>]*>([\s\S]*?)<\/h2>/);
      const plain = (s: string) =>
        s
          .replace(/<[^>]+>/g, " ")
          .replace(/&#x([\da-f]+);/gi, (_, n) =>
            String.fromCodePoint(parseInt(n, 16)),
          )
          .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/\s+/g, " ")
          .trim();
      entries.push({
        title: doc.title,
        section: heading ? plain(heading[1]).replace(/#$/, "").trim() : "概览",
        text: plain(part),
        url: withBase(`docs/${doc.slug}/`) + (id ? "#" + id[1] : ""),
      });
    }
  }
  return new Response(JSON.stringify(entries), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
