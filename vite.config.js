import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // VitePWA({
    //   registerType: "autoUpdate",
    //   manifest: {
    //     name: "MediSync Health Companion",
    //     short_name: "MediSync",
    //     description:
    //       "Your personal health companion for medication adherence and tracking.",
    //     theme_color: "#ffffff",
    //   },
    // }),
  ],
});
