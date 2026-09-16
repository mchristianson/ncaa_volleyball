import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NCAA Volleyball — Scores & Stats",
    short_name: "NCAA VB",
    description:
      "NCAA Division I women's volleyball scores, schedules, box scores and rankings.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0d11",
    theme_color: "#0b0d11",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
