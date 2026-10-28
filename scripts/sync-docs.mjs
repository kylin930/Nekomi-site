import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { website } from "../website.config.mjs";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { remarkQuickStart } from "../src/lib/quick-start.mjs";
import { docs } from "../src/data/docs.mjs";
// Explicit, reviewable synchronization. Builds use this committed snapshot offline.
const root = resolve(import.meta.dirname, "..");
let temp;
try {
  let source = process.env.NEKOMI_SOURCE;
  if (!source) {
    temp = mkdtempSync(join(tmpdir(), "nekomi-docs-"));
    source = join(temp, "source");
    execFileSync(
      "git",
      [
        "clone",
        "--depth",
        "1",
        "--branch",
        website.docs.ref,
        website.docs.repository,
        source,
      ],
      { stdio: "inherit" },
    );
  }
  const git = (...args) =>
    execFileSync("git", ["-C", source, ...args], { encoding: "utf8" }).trim();
  const commit = git("rev-parse", "HEAD");
  const remote = git("config", "--get", "remote.origin.url");
  if (remote !== website.docs.repository)
    throw new Error("Source repository differs from website.config.mjs");
  if (git("status", "--porcelain"))
    throw new Error(
      "Source contains local changes; refusing an untraceable snapshot.",
    );
  const repo = website.docs.repository.replace(/\.git$/, "");
  const snapshot = {};
  for (const file of [
    ...new Set([...docs.map((x) => x.source), "CHANGELOG.md", "LICENSE"]),
  ])
    snapshot[file] = readFileSync(join(source, file), "utf8");
  // Reject a renamed/missing installation section before replacing any saved snapshot.
  const readmeProcessor = await createMarkdownProcessor({
    syntaxHighlight: false,
    remarkPlugins: [remarkQuickStart],
  });
  await readmeProcessor.render(snapshot["README.md"]);
  // Only contemporary, wallpaper-free interface screenshots with documented provenance.
  const assets = readdirSync(join(source, "screenshots")).filter(
    (x) =>
      /^p30-(default|fresh|minimal)-home-(light|dark)-(1440|390)\.png$/.test(
        x,
      ) ||
      /^p31-(reader|callouts|tabs|math|diagrams)-(light|dark)-(1440|390)\.png$/.test(
        x,
      ),
  );
  if (assets.length !== 32)
    throw new Error(
      `Expected 32 known screenshots, found ${assets.length}; review upstream changes.`,
    );
  // Verify actual upstream state. API failure is fatal, never interpreted as zero releases.
  const releaseData = JSON.parse(
    execFileSync(
      "curl",
      [
        "--max-time",
        "60",
        "--fail",
        "--silent",
        "--show-error",
        "--location",
        repo.replace("https://github.com/", "https://api.github.com/repos/") +
          "/releases?per_page=100",
      ],
      { encoding: "utf8" },
    ),
  );
  const releases = releaseData
    .filter((x) => !x.draft)
    .map((x) => ({
      tag: x.tag_name,
      prerelease: x.prerelease,
      url: x.html_url,
    }));
  const tags = git("ls-remote", "--tags", "origin")
    .split("\n")
    .filter(Boolean)
    .map((x) => x.split("refs/tags/")[1])
    .filter((x) => !x.endsWith("^{}"));
  const data = {
    repository: repo,
    ref: website.docs.ref,
    commit,
    version: JSON.parse(readFileSync(join(source, "package.json"), "utf8"))
      .version,
    checkedAt: new Date().toISOString(),
    tags,
    releases,
    assets,
    files: snapshot,
  };
  const out = join(root, "public/screenshots");
  mkdirSync(out, { recursive: true });
  for (const file of assets)
    copyFileSync(join(source, "screenshots", file), join(out, file));
  mkdirSync(join(root, "vendor/nekomi"), { recursive: true });
  writeFileSync(
    join(root, "vendor/nekomi/snapshot.json"),
    JSON.stringify(data, null, 2) + "\n",
  );
  copyFileSync(
    join(source, "LICENSE"),
    join(root, "public/NEKOMI-LICENSE.txt"),
  );
  console.log(
    `Synced ${Object.keys(snapshot).length} sources and ${assets.length} screenshots at ${commit}. Tags: ${tags.length}, releases: ${releases.length}.`,
  );
} finally {
  if (temp) rmSync(temp, { recursive: true, force: true });
}
