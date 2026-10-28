const preference = matchMedia("(prefers-reduced-motion: reduce)");
const running = new Set<Animation>();
const motions = new WeakMap<Element, Map<string, Animation>>();
export const reducedMotion = () => preference.matches;
export function timing(token: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
  return value.endsWith("ms") ? parseFloat(value) : parseFloat(value) * 1000;
}
export function cancelMotion(element: Element) {
  motions.get(element)?.forEach((animation) => animation.cancel());
}
export async function animate(
  element: Element,
  key: string,
  frames: Keyframe[],
  phase: "spatial" | "effects" = "effects",
  fast = false,
  signal?: AbortSignal,
) {
  const map = motions.get(element) || new Map<string, Animation>();
  motions.set(element, map);
  map.get(key)?.cancel();
  if (preference.matches || signal?.aborted) return Promise.resolve();
  const animation = element.animate(frames, {
    duration: timing(`--site-${phase}-${fast ? "fast" : "default"}`),
    easing: getComputedStyle(document.documentElement)
      .getPropertyValue(`--site-ease-${phase}`)
      .trim(),
    fill: "both",
  });
  map.set(key, animation);
  running.add(animation);
  const cancel = () => animation.cancel();
  signal?.addEventListener("abort", cancel, { once: true });
  return animation.finished
    .catch(() => {})
    .finally(() => {
      signal?.removeEventListener("abort", cancel);
      if (map.get(key) === animation) map.delete(key);
      running.delete(animation);
      animation.cancel();
    });
}
preference.addEventListener("change", () => {
  if (preference.matches) running.forEach((animation) => animation.cancel());
});
window.addEventListener("pagehide", () =>
  running.forEach((animation) => animation.cancel()),
);
