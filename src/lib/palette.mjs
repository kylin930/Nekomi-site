// Public palette contract. HEX validation matches Nekomi's six-digit color schema.
/** @type {Readonly<{color:string,secondary:string,mode:"auto"|"light"|"dark"}>} */
export const defaultPalette = Object.freeze({
  color: "#8064B1",
  secondary: "",
  mode: "auto",
});
export const colorChoices = [
  { name: "藤紫", color: "#8064B1" },
  { name: "樱粉", color: "#E69DB3" },
  { name: "青绿", color: "#427F79" },
  { name: "雾蓝", color: "#8C9AC5" },
  { name: "陶橙", color: "#B75D28" },
];
export const isHex = (value) =>
  typeof value === "string" && /^#[\da-f]{6}$/i.test(value);
/** @returns {{color:string,secondary:string,mode:"auto"|"light"|"dark"}|null} */
export function parsePalette(value) {
  if (
    !value ||
    !isHex(value.color) ||
    (value.secondary !== "" && !isHex(value.secondary)) ||
    !["auto", "light", "dark"].includes(value.mode)
  )
    return null;
  return {
    color: value.color.toUpperCase(),
    secondary: value.secondary.toUpperCase(),
    mode: value.mode,
  };
}
export function paletteConfig(value) {
  const palette = parsePalette(value);
  if (!palette) throw new Error("Invalid Nekomi appearance colors");
  // Explicit empty secondary clears an existing override when merging appearance.
  return JSON.stringify(
    { appearance: { preset: "default", ...palette } },
    null,
    2,
  );
}
