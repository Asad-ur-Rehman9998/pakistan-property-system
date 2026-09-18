import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PropertyCheck Pakistan",
    short_name: "PropertyCheck",
    description: "Due diligence before you commit money on a Pakistan property.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "portrait",
    background_color: "#f3eee4",
    theme_color: "#0c3324",
    lang: "en",
    dir: "auto",
    categories: ["finance", "utilities"],
    prefer_related_applications: false,
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
