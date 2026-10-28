// Test-only bundle of the actual upstream theme implementation; never published in dist/.
import { build } from "vite";
import { resolve, join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
const source = process.env.NEKOMI_SOURCE;
if (!source)
  throw new Error(
    "Set NEKOMI_SOURCE to the clean, installed upstream theme checkout.",
  );
const result = resolve("test-results");
mkdirSync(result, { recursive: true });
const entry = join(result, "oracle-entry.mjs");
writeFileSync(
  entry,
  `import {createTheme} from ${JSON.stringify(resolve(source, "src/scripts/theme.js"))};
import {configureUI} from ${JSON.stringify(resolve(source, "src/scripts/ui.js"))};
import {resolveConfig} from ${JSON.stringify(resolve(source, "src/config/schema.mjs"))};
export function read(appearance){
 document.documentElement.className='';document.documentElement.style.cssText='';
 document.body.innerHTML='<div class="site-wallpaper" hidden></div>';
 const config=resolveConfig({appearance});const data={...config,base:'/'};
 configureUI(data);createTheme(data);
 const tokens=getComputedStyle(document.documentElement);
 return Object.fromEntries(['primary','on-primary','primary-container','on-primary-container','secondary','on-secondary','secondary-container','on-secondary-container','surface','surface-container-low','surface-container-high','outline'].map(role=>[role,tokens.getPropertyValue('--mdui-color-'+role).trim()]));
}`,
);
await build({
  configFile: false,
  build: {
    outDir: join(result, "oracle"),
    lib: {
      entry,
      formats: ["iife"],
      name: "NekomiThemeOracle",
      fileName: () => "oracle.js",
    },
    emptyOutDir: true,
    minify: false,
  },
});
