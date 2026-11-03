import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PSPK HRIS - Sistem Kepegawaian",
    short_name: "PSPK HRIS",
    description: "Sistem Manajemen Kepegawaian, Presensi, dan Cuti PSPK",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9ff",
    theme_color: "#102e50",
    orientation: "portrait",
    scope: "/",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

