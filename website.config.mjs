// Public settings only. Origin and deployment path are deliberately separate.
export const website = {
  name: "Nekomi",
  description:
    "基于 Astro、MDUI 2 与 Material Design 3 的静态博客主题。用 Markdown 记录，让阅读回归舒适。",
  url: "", // e.g. https://your-name.github.io (no path)
  base: "/", // e.g. /Nekomi-website/
  demoUrl: "", // Set only after a real demo has been deployed.
  github: "https://github.com/kylin930/Nekomi",
  docs: { repository: "https://github.com/kylin930/Nekomi.git", ref: "main" },
  indexing: true,
};
export function resolveSettings(env = process.env) {
  const url = env.SITE_URL ?? website.url;
  const base = env.SITE_BASE ?? website.base;
  const demoUrl = env.DEMO_URL ?? website.demoUrl;
  if (
    !/^\/(?:[\w.~-]+\/)*$/.test(base) ||
    base.split("/").some((x) => x === "." || x === "..")
  )
    throw new Error(
      "SITE_BASE must start and end with / and contain no dot segments.",
    );
  if (url) {
    const parsed = new URL(url);
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.origin !== url.replace(/\/$/, "") ||
      parsed.username ||
      parsed.password
    )
      throw new Error(
        "SITE_URL must be an HTTP(S) origin without a path, query or credentials.",
      );
  }
  if (demoUrl && !/^https:\/\//.test(demoUrl))
    throw new Error("DEMO_URL must be an HTTPS URL.");
  return { ...website, url: url.replace(/\/$/, ""), base, demoUrl };
}
export const settings = resolveSettings();
export const withBase = (path = "") => settings.base + path.replace(/^\//, "");
export const absolute = (path = "") =>
  settings.url ? new URL(withBase(path), settings.url).href : undefined;
