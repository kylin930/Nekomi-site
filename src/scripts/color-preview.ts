import "mdui/components/button.js";
import { setColorScheme } from "mdui/functions/setColorScheme.js";
import { setTheme } from "mdui/functions/setTheme.js";
import { defaultPalette, parsePalette } from "../lib/palette.mjs";
let colors = "";
function apply(value: typeof defaultPalette) {
  const palette = parsePalette(value);
  if (!palette) return;
  const key = palette.color + palette.secondary;
  // MDUI removes the previous palette style itself; mode changes need no regeneration.
  if (key !== colors) {
    setColorScheme(palette.color, {
      customColors: palette.secondary
        ? [{ name: "accent", value: palette.secondary }]
        : [],
    });
    colors = key;
  }
  // Match Nekomi src/scripts/theme.js: accent supplies the four secondary roles.
  for (const role of [
    "secondary",
    "on-secondary",
    "secondary-container",
    "on-secondary-container",
  ]) {
    if (palette.secondary)
      document.documentElement.style.setProperty(
        "--mdui-color-" + role,
        `var(--mdui-color-${role.replace("secondary", "accent")})`,
      );
    else document.documentElement.style.removeProperty("--mdui-color-" + role);
  }
  setTheme(palette.mode);
  document.documentElement.dataset.paletteReady = "true";
  document.querySelector("[data-preview-mode]")!.textContent = {
    auto: "跟随系统",
    light: "浅色",
    dark: "深色",
  }[palette.mode];
  resize();
}
function send(type: string, extra: object = {}) {
  if (parent !== window)
    parent.postMessage({ type, ...extra }, location.origin);
}
function resize() {
  send("nekomi:palette:height", {
    height: Math.ceil(document.body.scrollHeight),
  });
}
window.addEventListener("message", (event) => {
  if (
    event.origin !== location.origin ||
    event.source !== parent ||
    !event.data
  )
    return;
  if (event.data.type === "nekomi:palette:hello") send("nekomi:palette:ready");
  if (event.data.type === "nekomi:palette:update") apply(event.data.palette);
});
apply(defaultPalette);
send("nekomi:palette:ready");
new ResizeObserver(resize).observe(document.querySelector("main")!);
document.querySelector("[data-preview-read]")?.addEventListener("click", () => {
  const excerpt = document.querySelector<HTMLElement>(
    "[data-preview-excerpt]",
  )!;
  excerpt.hidden = !excerpt.hidden;
  document.querySelector("[data-preview-read]")!.textContent = excerpt.hidden
    ? "展开正文片段"
    : "收起正文片段";
  document
    .querySelector("[data-preview-read]")!
    .setAttribute("aria-expanded", String(!excerpt.hidden));
});
document.querySelector("[data-preview-note]")?.addEventListener("click", () => {
  const note = document.querySelector<HTMLElement>(
    "[data-preview-note-content]",
  )!;
  note.hidden = !note.hidden;
  document
    .querySelector("[data-preview-note]")!
    .setAttribute("aria-expanded", String(!note.hidden));
});
