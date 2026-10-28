import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveSettings, settings } from "../website.config.mjs";
import {
  docs,
  resolveLink,
  snapshot,
  renderSource,
} from "../src/lib/content.mjs";
test("deployment origin and path are validated independently", () => {
  assert.equal(
    resolveSettings({ SITE_URL: "https://example.org", SITE_BASE: "/Nekomi/" })
      .base,
    "/Nekomi/",
  );
  for (const SITE_URL of [
    "https://example.org/blog",
    "https://user:secret@example.org",
    "javascript:foo",
  ])
    assert.throws(() => resolveSettings({ SITE_URL }));
  for (const SITE_BASE of ["blog", "/../", "/a//", "/a/./"])
    assert.throws(() => resolveSettings({ SITE_BASE }));
  assert.throws(() => resolveSettings({ DEMO_URL: "javascript:alert(1)" }));
});
test("upstream relative links resolve to local docs or pinned source", () => {
  assert.equal(
    resolveLink("CONFIGURATION.md#site", "docs/CONFIGURATION-GUIDE.md"),
    `${settings.base}docs/configuration/#site`,
  );
  assert.equal(
    resolveLink("../README.md#开始使用", "docs/PUBLISHING.md"),
    `${settings.base}docs/getting-started/#开始使用`,
  );
  assert.equal(
    resolveLink("#站点名称与头像", "docs/CONFIGURATION-GUIDE.md"),
    "#站点名称与头像",
  );
  assert.equal(
    resolveLink("../examples/full.config.json", "docs/CONFIGURATION.md"),
    `${snapshot.repository}/blob/${snapshot.commit}/examples/full.config.json`,
  );
});
test("all source snapshots render and every supplied screenshot exists", async () => {
  assert.match(snapshot.commit, /^[a-f0-9]{40}$/);
  assert.equal(snapshot.assets.length, 32);
  for (const name of snapshot.assets) {
    const data = readFileSync(
      new URL("../public/screenshots/" + name, import.meta.url),
    );
    assert.equal(data.subarray(1, 4).toString(), "PNG");
  }
  for (const doc of docs) {
    const result = await renderSource(doc.source);
    assert.ok(result.html.length > 100);
    if (/^## /m.test(snapshot.files[doc.source]))
      assert.ok(result.headings.length > 0, doc.slug);
    assert.ok(!/href="(?:\.\.\/|[A-Z]+\.md)/.test(result.html));
  }
  const result = await renderSource("docs/MARKDOWN.md");
  assert.match(result.html, /astro-code/);
  assert.match(result.html, /:::note/); // Extension examples remain literal code.
});
