import type { Metadata, Viewport } from "next";
import { Lora, Rubik } from "next/font/google";
import "./globals.css";
import { PwaInstaller } from "@/components/shell/pwa-installer";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#102e50",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "HRIS PSPK - Pusat Studi Pendidikan dan Kebijakan",
    template: "%s | HRIS PSPK",
  },
  description: "Sistem Informasi Sumber Daya Manusia Terpadu PSPK",
  applicationName: "HRIS PSPK",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HRIS PSPK",
  },
  formatDetection: {
    telephone: false,
  },
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/favicon.png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${lora.variable} ${rubik.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <PwaInstaller />
        {children}
      </body>
    </html>
  );
}
