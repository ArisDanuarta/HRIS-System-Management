"use client";

import { PspkLogo, type PspkLogoVariant } from "./pspk-logo";

export interface PspkLoaderProps {
  /** Default "loop". Pakai "assemble" / "draw" untuk splash sekali jalan. */
  variant?: Exclude<PspkLogoVariant, "static">;
  /**
   * true  : menutup seluruh layar (root loading, splash, auth)
   * false : mengisi area konten saja (loading.tsx di dalam layout
   *         ber-sidebar/navbar, Suspense fallback, dynamic import)
   */
  fullScreen?: boolean;
  size?: number;
  /** Warna latar. Default putih karena biru logo (#133357) gelap. */
  background?: string;
  /** Teks tampil opsional di bawah logo, mis. "Memuat data…". */
  label?: string;
  className?: string;
  /** Dipanggil saat animasi satu putaran selesai (khususnya untuk variant draw dan assemble) */
  onComplete?: () => void;
}

export function PspkLoader({
  variant = "loop",
  fullScreen = true,
  size,
  background = "#ffffff",
  label,
  className,
  onComplete,
}: PspkLoaderProps) {
  const logoSize = size ?? (fullScreen ? 120 : 88);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label ?? "Memuat"}
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background,
        ...(fullScreen
          ? { position: "fixed", inset: 0, zIndex: 9999 }
          : { width: "100%", minHeight: "50vh", padding: 24 }),
      }}
    >
      <PspkLogo
        variant={variant}
        size={logoSize}
        title={null}
        onComplete={onComplete}
      />
      {label ? (
        <span style={{ fontSize: 14, color: "#133357" }}>{label}</span>
      ) : null}
    </div>
  );
}
