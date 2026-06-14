import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI 맞춤 일정 플래너",
    short_name: "AI 플래너",
    description: "나만을 위한 AI 맞춤 하루/주간 일정을 생성하세요",
    start_url: "/planner",
    display: "standalone",
    background_color: "#f9f8f5",
    theme_color: "#4f46e5",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
