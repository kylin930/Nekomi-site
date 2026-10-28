import type { Button } from "mdui/components/button.js";
import {
  defaultPalette,
  isHex,
  parsePalette,
  paletteConfig,
} from "../lib/palette.mjs";
const lab = document.querySelector<HTMLElement>("[data-color-lab]");
if (lab) {
  lab
    .querySelector("form")
    ?.addEventListener("submit", (event) => event.preventDefault());
  const get = <T extends Element = HTMLElement>(s: string) =>
    lab.querySelector<T>(s)!;
  const frame = get<HTMLIFrameElement>("[data-palette-frame]");
  const primary = get<HTMLInputElement>("#lab-primary"),
    primaryPicker = get<HTMLInputElement>("#lab-primary-picker");
  const secondary = get<HTMLInputElement>("#lab-secondary"),
    secondaryPicker = get<HTMLInputElement>("#lab-secondary-picker");
  const useSecondary = get<HTMLInputElement>("#lab-use-secondary"),
    mode = get<HTMLSelectElement>("#lab-mode");
  const copy = get<Button>("[data-copy-palette]"),
    validation = get("#lab-validation");
  let ready = false;
  let valid = true;
  let palette = { ...defaultPalette };
  const post = (type: string, extra: object = {}) =>
    frame.contentWindow?.postMessage({ type, ...extra }, location.origin);
  function update() {
    secondary.disabled = secondaryPicker.disabled = !useSecondary.checked;
    get("[data-secondary-fields]").hidden = !useSecondary.checked;
    useSecondary.setAttribute("aria-expanded", String(useSecondary.checked));
    const primaryValid = isHex(primary.value),
      secondaryValid = !useSecondary.checked || isHex(secondary.value);
    primary.setAttribute("aria-invalid", String(!primaryValid));
    secondary.setAttribute("aria-invalid", String(!secondaryValid));
    valid = primaryValid && secondaryValid;
    validation.textContent = valid
      ? ""
      : "请使用 # 加六位 HEX；预览暂时保留上一次有效配色。";
    copy.disabled = !ready || !valid;
    get("[data-lab-copy-status]").textContent = "";
    if (!valid) return;
    palette = parsePalette({
      color: primary.value,
      secondary: useSecondary.checked ? secondary.value : "",
      mode: mode.value,
    })!;
    primaryPicker.value = palette.color;
    if (useSecondary.checked) secondaryPicker.value = palette.secondary;
    get("[data-palette-json]").textContent = paletteConfig(palette);
    lab!
      .querySelectorAll<HTMLElement>("[data-lab-color]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.labColor === palette.color),
        ),
      );
    if (ready) post("nekomi:palette:update", { palette });
  }
  window.addEventListener("message", (event) => {
    if (
      event.origin !== location.origin ||
      event.source !== frame.contentWindow ||
      !event.data
    )
      return;
    if (event.data.type === "nekomi:palette:ready") {
      ready = true;
      get<HTMLFieldSetElement>("[data-lab-fields]").disabled = false;
      get("[data-lab-ready]").textContent = "预览已就绪，颜色修改即时生效。";
      update();
    }
    if (
      event.data.type === "nekomi:palette:height" &&
      Number.isFinite(event.data.height)
    )
      frame.style.height =
        Math.min(1800, Math.max(280, event.data.height)) + "px";
  });
  frame.addEventListener("load", () => post("nekomi:palette:hello"));
  post("nekomi:palette:hello");
  for (const field of [primary, secondary, useSecondary, mode])
    field.addEventListener("input", update);
  primaryPicker.addEventListener("input", () => {
    primary.value = primaryPicker.value;
    update();
  });
  secondaryPicker.addEventListener("input", () => {
    secondary.value = secondaryPicker.value;
    update();
  });
  lab.querySelectorAll<HTMLElement>("[data-lab-color]").forEach((button) =>
    button.addEventListener("click", () => {
      primary.value = button.dataset.labColor!;
      update();
    }),
  );
  // Homepage links seed a main color without implying a complete design preset.
  const seed = new URLSearchParams(location.search).get("color");
  if (isHex(seed)) primary.value = seed!;
  get("[data-lab-reset]").addEventListener("click", () => {
    primary.value = defaultPalette.color;
    secondary.value = secondaryPicker.value = "#8C9AC5";
    useSecondary.checked = false;
    mode.value = defaultPalette.mode;
    update();
    get("[data-lab-copy-status]").textContent =
      "已恢复默认主色、自动辅助色与跟随系统。";
  });
  copy.addEventListener("click", async () => {
    if (!valid) return;
    try {
      await navigator.clipboard.writeText(paletteConfig(palette));
      get("[data-lab-copy-status]").textContent =
        "已复制。请将 appearance 合并进已有配置。";
    } catch {
      get("[data-lab-copy-status]").textContent =
        "复制未完成，可在右侧代码框中选择并手动复制。";
    }
  });
  update();
}
