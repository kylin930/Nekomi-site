import { test } from "node:test";
import assert from "node:assert/strict";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { remarkQuickStart } from "../src/lib/quick-start.mjs";
import {
  defaultPalette,
  parsePalette,
  paletteConfig,
} from "../src/lib/palette.mjs";
import { renderSource } from "../src/lib/content.mjs";
test("palette JSON accepts six-digit colors, clears disabled secondary and retains mode", () => {
  for (const color of ["#000000", "#FFFFFF", "#1a2b3c", "#E69DB3"]) {
    const config = JSON.parse(
      paletteConfig({
        ...defaultPalette,
        color,
        secondary: "#8c9ac5",
        mode: "dark",
      }),
    );
    assert.deepEqual(config.appearance, {
      preset: "default",
      color: color.toUpperCase(),
      secondary: "#8C9AC5",
      mode: "dark",
    });
  }
  assert.equal(
    JSON.parse(paletteConfig(defaultPalette)).appearance.secondary,
    "",
  );
  for (const color of [
    "#abc",
    "#12345678",
    "red",
    "#xyz123",
    "123456",
    "",
    null,
  ])
    assert.equal(parsePalette({ ...defaultPalette, color }), null);
  assert.equal(parsePalette({ ...defaultPalette, secondary: "#abc" }), null);
  assert.equal(parsePalette({ ...defaultPalette, mode: "system" }), null);
});
test("README selection follows AST sections, ignoring fenced headings and unrelated history", async () => {
  const processor = await createMarkdownProcessor({
    remarkPlugins: [remarkQuickStart],
  });
  const input =
    "# Nekomi\n\n## 更新历史\n\nold history\n\n## 发布、SEO 与订阅\n\nPublish commands\n\n## 快速开始\n\n```md\n## 更新历史\n````\n\nInstall commands\n\n## 无关说明\n\nDo not include\n\n## 写第一篇文章\n\nWriting commands\n";
  const result = await processor.render(input);
  assert.match(result.code, /Install commands/);
  assert.match(result.code, /Publish commands/);
  assert.match(result.code, /Writing commands/);
  assert.doesNotMatch(result.code, /old history|Do not include/);
  assert.match(result.metadata.headings[0].text, /快速开始/);
  assert.throws(
    () => remarkQuickStart()({ children: [] }),
    /no recognized quick-start/,
  );
});
test("rendered quick start contains setup, writing and deployment but omits historical migration", async () => {
  const { html, headings } = await renderSource("README.md");
  assert.match(html.replace(/<[^>]*>/g, ""), /npm ci/);
  assert.match(html, /写第一篇文章/);
  assert.match(html, /GitHub Pages/);
  assert.ok(!headings.some((h) => /p24|迁移/.test(h.slug)));
  assert.ok(headings.some((h) => ["开始使用", "快速开始"].includes(h.slug)));
  assert.match(html, /id="开始使用"/);
  assert.match(html, /id="快速开始"/);
});
