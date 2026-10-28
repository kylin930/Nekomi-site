import {
  createMarkdownProcessor,
  rehypeHeadingIds,
} from "@astrojs/markdown-remark";
import { remarkQuickStart, remarkDocumentChrome } from "./quick-start.mjs";
import { posix } from "node:path";
import snapshot from "../../vendor/nekomi/snapshot.json" with { type: "json" };
import { docs } from "../data/docs.mjs";
import { withBase } from "../../website.config.mjs";
export { snapshot, docs };
export function sourceLink(file) {
  return `${snapshot.repository}/blob/${snapshot.commit}/${file}`;
}
let quickStartIds;
export function resolveLink(href, source, image = false) {
  if (
    source === "README.md" &&
    href?.startsWith("#") &&
    quickStartIds &&
    !quickStartIds.has(decodeURIComponent(href.slice(1)))
  )
    return sourceLink("README.md") + href;
  if (!href || /^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(href)) return href;
  const [file, hash] = href.split("#");
  const path = posix.normalize(posix.join(posix.dirname(source), file));
  const doc = docs.find((d) => d.source === path);
  if (doc) {
    if (
      path === "README.md" &&
      hash &&
      quickStartIds &&
      !quickStartIds.has(decodeURIComponent(hash))
    )
      return sourceLink(path) + "#" + hash;
    return withBase(`docs/${doc.slug}/`) + (hash ? "#" + hash : "");
  }
  if (path === "CHANGELOG.md")
    return withBase("changelog/") + (hash ? "#" + hash : "");
  if (
    snapshot.assets.includes(posix.basename(path)) &&
    path.startsWith("screenshots/")
  )
    return withBase("screenshots/" + posix.basename(path));
  return (
    `${snapshot.repository}/${image ? "raw" : "blob"}/${snapshot.commit}/${path}` +
    (hash ? "#" + hash : "")
  );
}
function links(source) {
  return () => (tree) => {
    if (source === "README.md") {
      quickStartIds = new Set();
      const collect = (node) => {
        if (/^h[1-6]$/.test(node.tagName) && node.properties?.id)
          quickStartIds.add(node.properties.id);
        node.children?.forEach(collect);
      };
      collect(tree);
      // Preserve existing website bookmarks when upstream renames the installation heading.
      const first = tree.children.find((node) => node.tagName === "h2");
      if (first)
        for (const alias of ["开始使用", "快速开始"])
          if (!quickStartIds.has(alias)) {
            tree.children.splice(tree.children.indexOf(first), 0, {
              type: "element",
              tagName: "span",
              properties: {
                id: alias,
                className: ["heading-alias"],
                "aria-hidden": "true",
              },
              children: [],
            });
            quickStartIds.add(alias);
          }
    }
    function walk(node) {
      const p = node.properties;
      if (node.tagName === "a" && p?.href) {
        p.href = resolveLink(String(p.href), source);
        if (/^https?:/.test(p.href)) {
          p.target = "_blank";
          p.rel = "noopener noreferrer";
        }
      }
      if (node.tagName === "img" && p?.src) {
        p.src = resolveLink(String(p.src), source, true);
        p.loading = "lazy";
        p.decoding = "async";
      }
      if (/^h[2-6]$/.test(node.tagName) && p?.id) {
        node.children.push({
          type: "element",
          tagName: "a",
          properties: {
            href: "#" + p.id,
            className: ["heading-anchor"],
            "aria-label": "此章节的永久链接",
          },
          children: [{ type: "text", value: "#" }],
        });
      }
      node.children?.forEach(walk);
      if (node.children)
        node.children = node.children.map((child) =>
          child.tagName === "table"
            ? {
                type: "element",
                tagName: "div",
                properties: {
                  className: ["table-scroll"],
                  tabIndex: 0,
                  role: "region",
                  "aria-label": "可横向滚动的表格",
                },
                children: [child],
              }
            : child,
        );
    }
    walk(tree);
  };
}
const cache = new Map();
export async function renderSource(source) {
  if (!cache.has(source))
    cache.set(
      source,
      (async () => {
        if (source !== "README.md") await renderSource("README.md");
        const processor = await createMarkdownProcessor({
          remarkPlugins: [
            ...(source === "README.md" ? [remarkQuickStart] : []),
            remarkDocumentChrome,
          ],
          shikiConfig: {
            themes: { light: "github-light", dark: "github-dark" },
            defaultColor: false,
          },
          rehypePlugins: [rehypeHeadingIds, links(source)],
        });
        const markdown = snapshot.files[source];
        const result = await processor.render(markdown);
        return {
          html: result.code,
          headings: result.metadata.headings.map((h) => ({
            ...h,
            text: h.text.replace(/#$/, "").trim(),
          })),
        };
      })(),
    );
  return cache.get(source);
}
