"use client";

import { motion, useReducedMotion, type SVGMotionProps } from "motion/react";

export type PspkLogoVariant = "static" | "draw" | "loop" | "assemble";

export interface PspkLogoProps {
  /**
   * static   : logo diam (tanpa animasi)
   * draw     : garis tergambar satu per satu, sekali jalan (intro / splash)
   * loop     : garis tergambar-terhapus berulang (loading)
   * assemble : 4 bentuk meluncur dari sudut lalu mengunci (splash / login)
   */
  variant?: PspkLogoVariant;
  size?: number | string;
  className?: string;
  /** Dipanggil saat bentuk terakhir selesai. Hanya untuk "draw" dan "assemble". */
  onComplete?: () => void;
  /** Label aksesibilitas. Isi null jika logo hanya dekoratif. */
  title?: string | null;
}

/**
 * JANGAN UBAH: path (d), warna (stroke), dan urutan di array ini
 * berasal dari logo resmi. Urutan array = urutan lapis (paint order)
 * seperti pada SVG asli. `order` hanya mengatur urutan animasi.
 */
const SHAPES = [
  { id: "biru", stroke: "#133357", order: 0, d: "M 142 125 H 400 V 385 H 205 L 142 442 Z", from: { x: -320, y: -320 } },
  { id: "merah", stroke: "#B52B17", order: 2, d: "M 402 385 H 660 V 645 H 465 L 402 705 Z", from: { x: -320, y: 320 } },
  { id: "kuning", stroke: "#F5A623", order: 1, d: "M 282 265 H 605 L 542 328 V 525 H 215 L 282 458 Z", from: { x: 320, y: -320 } },
  { id: "abu", stroke: "#959595", order: 3, d: "M 538 518 H 850 L 725 646 L 850 775 H 538 Z", from: { x: 320, y: 320 } },
] as const;

const LAST_ORDER = SHAPES.length - 1;
const STAGGER = 0.22;

function motionProps(
  variant: Exclude<PspkLogoVariant, "static">,
  shape: (typeof SHAPES)[number],
  onComplete?: () => void,
): SVGMotionProps<SVGPathElement> {
  const delay = shape.order * STAGGER;
  const done = shape.order === LAST_ORDER ? onComplete : undefined;

  switch (variant) {
    case "draw":
      return {
        initial: { pathLength: 0, opacity: 0 },
        animate: { pathLength: 1, opacity: 1 },
        transition: {
          pathLength: { duration: 0.8, delay, ease: "easeInOut" },
          opacity: { duration: 0.01, delay },
        },
        onAnimationComplete: done,
      };
    case "loop":
      return {
        initial: { pathLength: 0, opacity: 0 },
        animate: { pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] },
        transition: {
          duration: 2.4,
          times: [0, 0.35, 0.75, 1],
          ease: "easeInOut",
          repeat: Infinity,
          delay,
        },
      };
    case "assemble":
      return {
        initial: { x: shape.from.x, y: shape.from.y, opacity: 0 },
        animate: { x: 0, y: 0, opacity: 1 },
        transition: {
          x: { type: "spring", stiffness: 140, damping: 16, delay },
          y: { type: "spring", stiffness: 140, damping: 16, delay },
          opacity: { duration: 0.25, delay },
        },
        onAnimationComplete: done,
      };
  }
}

export function PspkLogo({
  variant = "static",
  size = 160,
  className,
  onComplete,
  title = "PSPK",
}: PspkLogoProps) {
  const reduceMotion = useReducedMotion();
  const effective: PspkLogoVariant = reduceMotion ? "static" : variant;

  return (
    <svg
      viewBox="0 0 1000 1000"
      width={size}
      height={size}
      fill="none"
      strokeWidth={42}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
    >
      {SHAPES.map((shape) =>
        effective === "static" ? (
          <path key={shape.id} d={shape.d} stroke={shape.stroke} />
        ) : (
          <motion.path
            key={shape.id}
            d={shape.d}
            stroke={shape.stroke}
            {...motionProps(effective, shape, onComplete)}
          />
        ),
      )}
    </svg>
  );
}
