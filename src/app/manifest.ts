import type { MetadataRoute } from "next";

// Lets a tradie add Site VIP to their home screen and open it like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Site VIP",
    short_name: "Site VIP",
    description: "Know if your business is in the black this month.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f1",
    theme_color: "#f6f5f1",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
