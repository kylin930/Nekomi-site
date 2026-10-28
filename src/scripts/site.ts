import "mdui/components/button.js";
import { setColorScheme } from "mdui/functions/setColorScheme.js";
setColorScheme("#8064b1");
const $ = <T extends Element = HTMLElement>(s: string) =>
  document.querySelector<T>(s);
const media = matchMedia("(prefers-color-scheme: dark)");
let mode = document.documentElement.dataset.mode || "system";
const themeSelect = $<HTMLSelectElement>("[data-theme-select]");
function applyTheme() {
  const dark = mode === "dark" || (mode === "system" && media.matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.dataset.mode = mode;
  document.documentElement.classList.remove(
    "mdui-theme-light",
    "mdui-theme-dark",
  );
  document.documentElement.classList.add(
    dark ? "mdui-theme-dark" : "mdui-theme-light",
  );
  if (themeSelect) themeSelect.value = mode;
}
applyTheme();
themeSelect?.addEventListener("change", () => {
  mode = themeSelect.value;
  try {
    localStorage.setItem("nekomi-website-theme", mode);
  } catch {}
  applyTheme();
});
media.addEventListener("change", applyTheme);
window.addEventListener("storage", (e) => {
  if (e.key === "nekomi-website-theme") {
    mode = e.newValue || "system";
    applyTheme();
  }
});
const menu = $("#mobile-menu");
const toggle = $("[data-menu-toggle]");
function closeMenu() {
  if (menu) menu.hidden = true;
  toggle?.setAttribute("aria-expanded", "false");
}
toggle?.addEventListener("click", () => {
  if (!menu) return;
  menu.hidden = !menu.hidden;
  toggle.setAttribute("aria-expanded", String(!menu.hidden));
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menu && !menu.hidden) {
    closeMenu();
    (toggle as HTMLElement)?.focus();
  }
});
document.addEventListener("click", (e) => {
  if (menu && !menu.hidden && !(e.target as Element).closest(".site-header"))
    closeMenu();
});
matchMedia("(min-width: 961px)").addEventListener("change", closeMenu);
const topButton = $<HTMLButtonElement>("[data-back-top]");
function scrollFeedback() {
  $(".site-header")?.classList.toggle("scrolled", scrollY > 8);
  if (topButton) topButton.hidden = scrollY < 450;
}
window.addEventListener("scroll", scrollFeedback, { passive: true });
scrollFeedback();
topButton?.addEventListener("click", () => {
  $("#main")?.focus({ preventScroll: true });
  window.scrollTo({
    top: 0,
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
});
// Native document navigation preserves history and scroll restoration, with progressive cross-document View Transitions.
document.querySelectorAll<HTMLElement>("[data-showcase]").forEach((root) => {
  let preset = "default",
    dark = document.documentElement.dataset.theme === "dark",
    mobile = matchMedia("(max-width: 700px)").matches;
  const image = root.querySelector<HTMLImageElement>("[data-shot]")!;
  const full = root.querySelector<HTMLAnchorElement>("[data-shot-full]")!;
  const caption = root.querySelector("[data-shot-caption]")!;
  const status = root.querySelector("[data-shot-status]")!;
  function update() {
    const label = `${preset[0].toUpperCase() + preset.slice(1)} · ${dark ? "深色" : "浅色"} · ${mobile ? "手机" : "桌面"}`;
    const src = `${root.dataset.base}p30-${preset}-home-${dark ? "dark" : "light"}-${mobile ? "390" : "1440"}.png`;
    image.src = src;
    image.alt = label + "首页真实截图";
    image.width = mobile ? 390 : 1440;
    image.height = mobile ? 844 : 900;
    full.href = src;
    caption.textContent = label;
    status.textContent = "已切换为 " + label;
    root.dataset.device = mobile ? "mobile" : "desktop";
    root
      .querySelectorAll<HTMLElement>("[data-preset]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.preset === preset)),
      );
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
  }
  update();
  root.querySelectorAll<HTMLElement>("[data-preset]").forEach((b) =>
    b.addEventListener("click", () => {
      preset = b.dataset.preset!;
      update();
    }),
  );
  root.querySelector("[data-shot-mode]")?.addEventListener("click", () => {
    dark = !dark;
    update();
  });
  root.querySelector("[data-shot-device]")?.addEventListener("click", () => {
    mobile = !mobile;
    update();
  });
});
// Copy reads the original code element; button labels never enter copied text.
document.querySelectorAll<HTMLPreElement>(".prose pre").forEach((pre) => {
  const button = document.createElement("mdui-button");
  button.setAttribute("variant", "text");
  button.className = "copy-code";
  button.textContent = "复制";
  button.setAttribute("aria-label", "复制代码");
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(
        pre.querySelector("code")?.textContent || "",
      );
      button.textContent = "已复制";
      setTimeout(() => (button.textContent = "复制"), 1800);
    } catch {
      button.textContent = "请手动选择复制";
    }
  });
  pre.append(button);
});
const navDetails = $<HTMLDetailsElement>(".docs-nav-details");
const mobileQuery = matchMedia("(max-width: 700px)");
function sizeDocs() {
  if (navDetails) navDetails.open = !mobileQuery.matches;
}
sizeDocs();
mobileQuery.addEventListener("change", sizeDocs);
const tocLinks = [
  ...document.querySelectorAll<HTMLAnchorElement>(".docs-toc a"),
];
if (tocLinks.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          tocLinks.forEach((link) => {
            const active =
              decodeURIComponent(link.hash.slice(1)) === entry.target.id;
            link.classList.toggle("active", active);
            if (active) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        }
    },
    { rootMargin: "-90px 0px -65% 0px" },
  );
  document
    .querySelectorAll(".prose h2,.prose h3")
    .forEach((h) => observer.observe(h));
}
// Lazy static search: same-origin JSON, textContent output, no server or HTML injection.
interface Entry {
  title: string;
  section: string;
  text: string;
  url: string;
}
const dialog = $<HTMLDialogElement>("#doc-search")!;
const input = $<HTMLInputElement>("#search-input")!;
const results = $("#search-results")!;
const searchStatus = $("#search-status")!;
let indexPromise: Promise<Entry[]> | undefined;
let queryId = 0;
// Close before document navigation so a restored history entry has no stale modal.
results.addEventListener("click", (event) => {
  if ((event.target as Element).closest("a")) dialog.close();
});
window.addEventListener("pagehide", () => {
  if (dialog.open) dialog.close();
});
function index(): Promise<Entry[]> {
  return (indexPromise ??= fetch(dialog.dataset.index!)
    .then((r) => {
      if (!r.ok) throw Error("index");
      return r.json();
    })
    .catch((e) => {
      indexPromise = undefined;
      throw e;
    }));
}
function openSearch() {
  closeMenu();
  if (!dialog.open) dialog.showModal();
  input.focus();
  void index().catch(() => {
    searchStatus.textContent = "索引加载失败，请检查网络后重新输入以重试。";
  });
}
document
  .querySelectorAll("[data-open-search]")
  .forEach((b) => b.addEventListener("click", openSearch));
$("[data-close-search]")?.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      dialog.close();
  }
});
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openSearch();
  }
});
input.addEventListener("input", async () => {
  const id = ++queryId;
  const query = input.value.trim().toLocaleLowerCase("zh-CN");
  results.replaceChildren();
  if (!query) {
    searchStatus.textContent = "输入关键词，查找指南和配置。";
    return;
  }
  searchStatus.textContent = "正在查找…";
  try {
    const data = await index();
    if (id !== queryId) return;
    const terms = query.split(/\s+/);
    const found = data
      .map((item) => ({
        item,
        score: terms.reduce(
          (s, t) =>
            s +
            (item.title.toLowerCase().includes(t) ? 12 : 0) +
            (item.section.toLowerCase().includes(t) ? 8 : 0),
          0,
        ),
      }))
      .filter(({ item }) =>
        terms.every((t) =>
          (item.title + " " + item.section + " " + item.text)
            .toLowerCase()
            .includes(t),
        ),
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    searchStatus.textContent = found.length
      ? `找到 ${found.length}${found.length === 20 ? " 条相关结果（最多显示 20 条）" : " 条相关结果"}`
      : "没有找到相关文档，试试更短的关键词。";
    for (const { item } of found) {
      const a = document.createElement("a");
      a.href = item.url;
      const small = document.createElement("small");
      small.textContent = item.title;
      const strong = document.createElement("strong");
      strong.textContent = item.section;
      const p = document.createElement("p");
      const start = Math.max(0, item.text.toLowerCase().indexOf(terms[0]) - 35);
      p.textContent =
        (start ? "…" : "") + item.text.slice(start, start + 130) + "…";
      a.append(small, strong, p);
      results.append(a);
    }
  } catch {
    if (id === queryId)
      searchStatus.textContent = "索引加载失败，请检查网络后重新输入以重试。";
  }
});
dialog.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    // type=search may consume the first Escape to clear its native input.
    e.preventDefault();
    dialog.close();
    return;
  }
  const links = [...results.querySelectorAll<HTMLAnchorElement>("a")];
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    const current = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next = current + (e.key === "ArrowDown" ? 1 : -1);
    (links[(next + links.length) % links.length] || input).focus();
  }
  if (e.key === "Enter" && document.activeElement === input && links.length) {
    e.preventDefault();
    links[0].click();
  }
});
