"use client";

import { PspkLogo } from "./pspk-logo";
import { PspkWordmark } from "./pspk-wordmark";

export type PspkLockupVariant = "horizontal" | "vertical";
export type PspkLockupTone = "color" | "white";

export interface PspkLockupProps {
  /** horizontal: mark di kiri, tulisan 2 baris. vertical: mark di atas, tulisan 3 baris. */
  variant?: PspkLockupVariant;
  /** Ukuran kotak mark dalam px. Ukuran tulisan dihitung otomatis dari sini. */
  size?: number;
  /** color: logo resmi 4 warna. white: monokrom putih untuk latar navy/gelap. */
  tone?: PspkLockupTone;
  /** true: mark merakit (assemble) sekali jalan, lalu tulisan fade-in. */
  animate?: boolean;
  className?: string;
  /** Dipanggil saat animasi mark selesai (hanya jika animate). */
  onComplete?: () => void;
}

/**
 * Proporsi diukur dari file logo resmi (mark = 1):
 * - Bentuk 4 path (termasuk tebal garis) menempati 75% lebar dan 69,2% tinggi kotak mark (viewBox 1000).
 * - Horizontal: tinggi blok tulisan 0,74 x tinggi bentuk, jarak 0,22 x tinggi bentuk.
 * - Vertikal: lebar bentuk 0,64 x lebar tulisan, jarak 0,096 x tinggi bentuk.
 */
const INK_W = 0.75;
const INK_H = 0.692;
const INK_LEFT = 0.121;
const INK_RIGHT_PAD = 0.129;
const INK_BOTTOM_PAD = 0.204;
const INK_CENTER_SHIFT = 0.05;
const VERTICAL_RATIO = 3.1633;

export function PspkLockup({
  variant = "horizontal",
  size = 64,
  tone = "color",
  animate = false,
  className,
  onComplete,
}: PspkLockupProps) {
  const white = tone === "white";
  const markStyle = white ? { filter: "brightness(0) invert(1)" } : undefined;
  const markVariant = animate ? "assemble" : "static";
  const wordColor = white ? "#ffffff" : undefined;
  const fadeProps = animate ? { fadeIn: true, fadeDelay: 1.0, fadeDuration: 0.6 } : {};

  if (variant === "vertical") {
    // lebar bentuk = 0,75 x size dan harus 0,64 x lebar tulisan
    const textWidth = (INK_W * size) / 0.64;
    const textHeight = textWidth / VERTICAL_RATIO;
    const gap = 0.096 * INK_H * size;

    return (
      <div
        className={className}
        style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}
      >
        <div style={markStyle}>
          <PspkLogo
            variant={markVariant}
            size={size}
            title={null}
            onComplete={animate ? onComplete : undefined}
          />
        </div>
        <PspkWordmark
          variant="vertical"
          height={textHeight}
          color={wordColor}
          style={{ marginTop: gap - INK_BOTTOM_PAD * size }}
          {...fadeProps}
        />
      </div>
    );
  }

  const inkHeight = INK_H * size;
  const textHeight = 0.74 * inkHeight;
  const gap = 0.22 * inkHeight;

  return (
    <div
      className={className}
      style={{ display: "inline-flex", alignItems: "center", marginLeft: -INK_LEFT * size }}
    >
      <div style={markStyle}>
        <PspkLogo
          variant={markVariant}
          size={size}
          title={null}
          onComplete={animate ? onComplete : undefined}
        />
      </div>
      <PspkWordmark
        variant="horizontal"
        height={textHeight}
        color={wordColor}
        style={{
          marginLeft: gap - INK_RIGHT_PAD * size,
          transform: `translateY(${-INK_CENTER_SHIFT * size}px)`,
        }}
        {...fadeProps}
      />
    </div>
  );
}
