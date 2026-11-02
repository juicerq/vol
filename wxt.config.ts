import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  zip: { excludeSources: ["output/**"] },
  modules: ["@wxt-dev/module-svelte"],
  svelte: { vite: { compilerOptions: { fragments: "tree" } } },
  manifest: {
    name: "Vol",
    description: "Volume independente por aba, de 0% a 200%.",
    permissions: ["tabs", "sessions", "webNavigation"],
    host_permissions: ["<all_urls>"],
    icons: { 48: "icon.svg", 96: "icon.svg", 128: "icon.svg" },
    action: { default_title: "Vol", default_icon: "icon.svg" },
    browser_specific_settings: {
      gecko: {
        id: "vol@juicerq",
        strict_min_version: "140.0",
        data_collection_permissions: { required: ["none"] },
      },
      gecko_android: { strict_min_version: "142.0" },
    },
  },
});
