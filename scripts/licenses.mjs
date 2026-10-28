// Retain complete notices for the MDUI browser dependency graph.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const visited = new Set();
const output = [];
function findPackage(name, from) {
  let dir = from;
  while (true) {
    const file = join(dir, "node_modules", name, "package.json");
    if (existsSync(file)) return file;
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`Missing dependency ${name}`);
    dir = parent;
  }
}
function visit(name, from = root) {
  const file = findPackage(name, from);
  if (visited.has(file)) return;
  visited.add(file);
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  const dir = dirname(file);
  const licenses = readdirSync(dir).filter((f) =>
    /^(LICENSE|LICENCE|COPYING|NOTICE)(\.|$)/i.test(f),
  );
  if (!licenses.length && name === "@lit-labs/ssr-dom-shim") {
    // This package omits a LICENSE file; use the same Lit monorepo BSD-3 notice.
    const lit = dirname(findPackage("lit", root));
    output.push(
      `===== ${pkg.name}@${pkg.version} (${pkg.license}) =====`,
      readFileSync(join(lit, "LICENSE"), "utf8"),
    );
  } else if (!licenses.length) throw new Error(`No license file for ${name}`);
  output.push(
    `===== ${pkg.name}@${pkg.version} (${pkg.license}) =====`,
    ...licenses.map((f) => readFileSync(join(dir, f), "utf8")),
  );
  for (const dependency of Object.keys(pkg.dependencies || {}))
    visit(dependency, dir);
}
visit("mdui");
writeFileSync(
  join(root, "public/THIRD-PARTY-LICENSES.txt"),
  output.join("\n\n"),
);
console.log(
  `Retained notices for ${visited.size} browser dependency packages.`,
);
