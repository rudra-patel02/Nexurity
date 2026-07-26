import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nexurity Smart Factory",
    short_name: "Nexurity",
    description: "Industrial AI, predictive maintenance, and smart factory operations.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#0891b2",
    categories: ["business", "productivity", "utilities"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
