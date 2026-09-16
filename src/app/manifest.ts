import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Volley Scores — NCAA Division I Volleyball",
    short_name: "Volley Scores",
    description:
      "NCAA Division I women's volleyball scores, schedules, box scores and rankings.",
    start_url: "/",
    display: "standalone",
    background_color: "#000d22",
    theme_color: "#000d22",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
