import { defineConfig } from "astro/config";
import { settings } from "./website.config.mjs";
export default defineConfig({
  site: settings.url || undefined,
  base: settings.base,
  output: "static",
  trailingSlash: "always",
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    },
  },
});
