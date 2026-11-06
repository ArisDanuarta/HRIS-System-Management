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
    // App shortcuts memungkinkan pengguna menekan lama ikon HRIS PSPK di home screen
    // untuk langsung mengakses fitur harian tanpa membuka aplikasi terlebih dahulu.
    shortcuts: [
      {
        name: "Presensi Hari Ini",
        short_name: "Presensi",
        description: "Check-in atau check-out kehadiran harian",
        url: "/absensi",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Ajukan Cuti",
        short_name: "Ajukan Cuti",
        description: "Buat pengajuan cuti baru",
        url: "/cuti/ajukan",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Beranda Dashboard",
        short_name: "Beranda",
        description: "Ringkasan kepegawaian dan aktivitas harian",
        url: "/dashboard",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}

