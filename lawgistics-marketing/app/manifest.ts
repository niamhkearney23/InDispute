import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lawgistics Marketing",
    short_name: "Lawgistics",
    description: "Describe the idea, check the draft, save the slides.",
    start_url: "/",
    display: "standalone",
    background_color: "#efece6",
    theme_color: "#efece6",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
