import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { posix } from "node:path";
import snapshot from "../../vendor/nekomi/snapshot.json" with { type: "json" };
import { docs } from "../data/docs.mjs";
import { withBase } from "../../website.config.mjs";
export { snapshot, docs };
export function sourceLink(file) {
  return `${snapshot.repository}/blob/${snapshot.commit}/${file}`;
}
export function resolveLink(href, source, image = false) {
  if (!href || /^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(href)) return href;
  const [file, hash] = href.split("#");
  const path = posix.normalize(posix.join(posix.dirname(source), file));
  const doc = docs.find((d) => d.source === path);
  if (doc) return withBase(`docs/${doc.slug}/`) + (hash ? "#" + hash : "");
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
        const processor = await createMarkdownProcessor({
          shikiConfig: {
            themes: { light: "github-light", dark: "github-dark" },
            defaultColor: false,
          },
          rehypePlugins: [links(source)],
        });
        let markdown = snapshot.files[source].replace(/^# [^\n]+\n/, "");
        // The website supplies a responsive TOC; omit the redundant upstream in-body TOC.
        markdown = markdown.replace(/\n## 目录\n[\s\S]*?(?=\n## )/, "\n");
        if (source === "README.md")
          markdown = markdown.slice(markdown.indexOf("## 开始使用"));
        const result = await processor.render(markdown);
        return { html: result.code, headings: result.metadata.headings };
      })(),
    );
  return cache.get(source);
}
