import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lawgistics Marketing",
    short_name: "Lawgistics",
    description: "One on-brand post a day: describe it, check it, save it.",
    start_url: "/",
    display: "standalone",
    background_color: "#08090B",
    theme_color: "#08090B",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
