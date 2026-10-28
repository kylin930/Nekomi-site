import "mdui/components/button.js";
import "mdui/components/button-icon.js";
import "mdui/components/dialog.js";
import "mdui/components/navigation-drawer.js";
import "mdui/components/fab.js";
import type { Dialog } from "mdui/components/dialog.js";
import type { NavigationDrawer } from "mdui/components/navigation-drawer.js";
import type { Fab } from "mdui/components/fab.js";
import { animate, reducedMotion } from "./motion";

export const dialog = document.querySelector<Dialog>("#doc-search")!;
const drawer = document.querySelector<NavigationDrawer>("#mobile-menu")!;
const toggle = document.querySelector<HTMLElement>("[data-menu-toggle]")!;
const fab = document.querySelector<Fab>("[data-back-top]")!;
let searchTrigger: HTMLElement | undefined;
export function closeMenu() {
  drawer.open = false;
}
export function openSearch() {
  closeMenu();
  if (dialog.open)
    document.querySelector<HTMLInputElement>("#search-input")?.focus();
  if (!dialog.open) searchTrigger = document.activeElement as HTMLElement;
  dialog.open = true;
}
export function closeSearch() {
  dialog.open = false;
}
dialog.addEventListener("opened", () =>
  document.querySelector<HTMLInputElement>("#search-input")?.focus(),
);
dialog.addEventListener("closed", () => {
  if (searchTrigger?.isConnected) searchTrigger.focus({ preventScroll: true });
});
toggle.addEventListener("click", () => {
  closeSearch();
  drawer.open = !drawer.open;
});
document
  .querySelector("[data-menu-close]")
  ?.addEventListener("click", closeMenu);
drawer.addEventListener("open", () =>
  toggle.setAttribute("aria-expanded", "true"),
);
drawer.addEventListener("close", () =>
  toggle.setAttribute("aria-expanded", "false"),
);
drawer.addEventListener("closed", () => {
  if (!dialog.open && matchMedia("(max-width:960px)").matches)
    toggle.focus({ preventScroll: true });
});
// Escape can arrive before the drawer's next-frame focus transfer has completed.
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && dialog.open) {
    event.preventDefault();
    closeSearch();
  } else if (event.key === "Escape" && drawer.open) {
    event.preventDefault();
    closeMenu();
  }
});
matchMedia("(min-width:961px)").addEventListener("change", closeMenu);

// Ordinary links keep their href and modifier-key behavior. Complete modal closure before
// same-window navigation so body scroll locks cannot survive a bfcache restoration.
for (const modal of [drawer, dialog]) {
  modal.addEventListener("click", (rawEvent: Event) => {
    const event = rawEvent as MouseEvent;
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      "a[href]",
    );
    if (
      !link ||
      !modal.open ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target === "_blank" ||
      link.hasAttribute("download")
    )
      return;
    event.preventDefault();
    modal.addEventListener("closed", () => location.assign(link.href), {
      once: true,
    });
    modal.open = false;
  });
}
window.addEventListener("pagehide", () => {
  closeSearch();
  closeMenu();
});
window.addEventListener("pageshow", () => {
  closeSearch();
  closeMenu();
  scheduleFeedback();
});

let feedbackPending = false;
let fabVisible = false;
let fabSequence = 0;
async function feedback() {
  feedbackPending = false;
  document
    .querySelector(".site-header")
    ?.classList.toggle("scrolled", scrollY > 8);
  const visible = scrollY >= 450 && !dialog.open && !drawer.open;
  if (visible === fabVisible) return;
  fabVisible = visible;
  const sequence = ++fabSequence;
  fab.inert = !visible;
  if (visible) fab.hidden = false;
  await animate(
    fab,
    "visibility",
    visible
      ? [
          { opacity: 0, transform: "translateY(12px) scale(.92)" },
          { opacity: 1, transform: "none" },
        ]
      : [
          { opacity: 1, transform: "none" },
          { opacity: 0, transform: "translateY(8px) scale(.96)" },
        ],
    "spatial",
    true,
  );
  if (sequence === fabSequence) fab.hidden = !visible;
}
function scheduleFeedback() {
  if (!feedbackPending) {
    feedbackPending = true;
    requestAnimationFrame(() => void feedback());
  }
}
window.addEventListener("scroll", scheduleFeedback, { passive: true });
for (const modal of [drawer, dialog])
  for (const name of ["open", "close"])
    modal.addEventListener(name, scheduleFeedback);
scheduleFeedback();
fab.addEventListener("click", () => {
  document.querySelector<HTMLElement>("#main")?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: reducedMotion() ? "instant" : "smooth" });
});
document.documentElement.dataset.uiReady = "true";
