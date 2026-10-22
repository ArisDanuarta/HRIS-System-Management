"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

// Warna sama dengan logo resmi, urutan sama dengan urutan animasi logo.
const COLORS = ["#133357", "#F5A623", "#B52B17", "#959595"];

export interface PageRevealProps {
  duration?: number;
  stagger?: number;
}

/**
 * Transisi halaman: 4 panel berwarna menutup layar lalu terbuka ke atas.
 * Pasang di app/template.tsx (template di-mount ulang di setiap navigasi,
 * jadi animasi ini jalan di setiap pindah route).
 */
export function PageReveal({ duration = 0.55, stagger = 0.08 }: PageRevealProps) {
  const reduceMotion = useReducedMotion();
  const [done, setDone] = useState(false);

  if (done || reduceMotion) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        display: "flex",
        pointerEvents: "none",
      }}
    >
      {COLORS.map((color, i) => (
        <motion.div
          key={color}
          style={{ flex: 1, background: color, transformOrigin: "top" }}
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0 }}
          transition={{ duration, delay: 0.1 + i * stagger, ease: [0.76, 0, 0.24, 1] }}
          onAnimationComplete={i === COLORS.length - 1 ? () => setDone(true) : undefined}
        />
      ))}
    </div>
  );
}
