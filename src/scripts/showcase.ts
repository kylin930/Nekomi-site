import type { Button } from "mdui/components/button.js";
import { animate, cancelMotion } from "./motion";

document.querySelectorAll<HTMLElement>("[data-showcase]").forEach((root) => {
  let preset = "default",
    dark = document.documentElement.dataset.theme === "dark",
    mobile = matchMedia("(max-width:700px)").matches;
  let revision = 0;
  let controller: AbortController | undefined;
  const image = root.querySelector<HTMLImageElement>("[data-shot]")!;
  const previous = root.querySelector<HTMLImageElement>(
    "[data-shot-previous]",
  )!;
  const full = root.querySelector<HTMLAnchorElement>("[data-shot-full]")!;
  const frame = root.querySelector<HTMLElement>(".browser-frame")!;
  const stage = root.querySelector<HTMLElement>(".shot-stage")!;
  const caption = root.querySelector("[data-shot-caption]")!;
  const status = root.querySelector("[data-shot-status]")!;
  const retry = root.querySelector<HTMLElement>("[data-shot-retry]")!;

  async function update() {
    const id = ++revision;
    controller?.abort();
    controller = new AbortController();
    const signal = controller.signal;
    [frame, image, previous].forEach(cancelMotion);
    previous.hidden = true;
    const nextMobile = mobile;
    const label = `${preset[0].toUpperCase() + preset.slice(1)} · ${dark ? "深色" : "浅色"} · ${mobile ? "手机" : "桌面"}`;
    const src = `${root.dataset.base}p30-${preset}-home-${dark ? "dark" : "light"}-${mobile ? "390" : "1440"}.png`;
    root.setAttribute("aria-busy", "true");
    retry.hidden = true;
    status.textContent = "正在加载 " + label;
    root
      .querySelector("[data-shot-mode]")
      ?.setAttribute("aria-label", `切换为${dark ? "浅色" : "深色"}截图`);
    root
      .querySelector("[data-shot-mode]")
      ?.setAttribute("aria-pressed", String(dark));
    root
      .querySelector("[data-shot-device]")
      ?.setAttribute("aria-label", `切换为${mobile ? "桌面" : "手机"}截图`);
    root
      .querySelector("[data-shot-device]")
      ?.setAttribute("aria-pressed", String(mobile));
    root.querySelectorAll<HTMLElement>("[data-shot-label]").forEach((label) => {
      label.textContent = label.parentElement!.getAttribute("aria-label");
    });
    try {
      const next = new Image();
      next.src = src;
      await next.decode();
      if (id !== revision || signal.aborted) return;
      // Measurements happen once per user selection, never in a scroll handler.
      const before = frame.getBoundingClientRect();
      const deviceChanged =
        root.dataset.device !== (nextMobile ? "mobile" : "desktop");
      previous.src = image.currentSrc || image.src;
      previous.hidden = false;
      image.src = src;
      image.alt = label + "首页真实截图";
      image.width = nextMobile ? 390 : 1440;
      image.height = nextMobile ? 844 : 900;
      root.dataset.device = nextMobile ? "mobile" : "desktop";
      full.href = src;
      caption.textContent = label;
      const after = frame.getBoundingClientRect();
      const tasks = [
        animate(
          image,
          "image",
          [{ opacity: 0 }, { opacity: 1 }],
          "effects",
          false,
          signal,
        ),
        animate(
          previous,
          "image",
          [{ opacity: 1 }, { opacity: 0 }],
          "effects",
          false,
          signal,
        ).then(() => {
          // Fade and spatial resize finish at different times. Remove the old
          // layer without waiting for the longer spatial resize.
          if (id === revision) previous.hidden = true;
        }),
      ];
      if (deviceChanged && before.width)
        tasks.push(
          animate(
            frame,
            "shape",
            [
              {
                width: `${before.width}px`,
                height: `${before.height}px`,
                maxWidth: "none",
              },
              {
                width: `${after.width}px`,
                height: `${after.height}px`,
                maxWidth: "none",
              },
            ],
            "spatial",
            false,
            signal,
          ),
        );
      await Promise.all(tasks);
      if (id !== revision) return;
      previous.hidden = true;
      status.textContent = "已切换为 " + label;
    } catch {
      if (id !== revision) return;
      status.textContent = "截图加载失败，保留当前截图。请重试。";
      retry.hidden = false;
    } finally {
      if (id === revision) root.setAttribute("aria-busy", "false");
    }
  }
  // Use public Button variants for this toolbar. MDUI 2.1.5 segmented groups
  // expose no public label for their hidden validation radio; selected is protected.
  root.querySelectorAll<Button>("[data-preset]").forEach((button) =>
    button.addEventListener("click", () => {
      if (button.dataset.preset === preset) return;
      preset = button.dataset.preset!;
      root.querySelectorAll<Button>("[data-preset]").forEach((item) => {
        const selected = item.dataset.preset === preset;
        item.variant = selected ? "tonal" : "outlined";
        item.querySelector("[data-preset-state]")!.textContent = selected
          ? "，当前预设"
          : "";
      });
      void update();
    }),
  );
  root.querySelector("[data-shot-mode]")?.addEventListener("click", () => {
    dark = !dark;
    void update();
  });
  root.querySelector("[data-shot-device]")?.addEventListener("click", () => {
    mobile = !mobile;
    void update();
  });
  retry.addEventListener("click", () => void update());
  // Reserve the same stage for both devices. Container units keep the phone inside it.
  stage.style.containerType = "size";
  void update();
});
