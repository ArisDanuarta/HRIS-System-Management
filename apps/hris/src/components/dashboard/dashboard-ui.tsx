import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Komponen dasar bersama untuk semua dashboard HRIS.
 * Tidak memakai hook / "use client" sehingga aman dipakai di server maupun client component.
 */

export type Tone = "navy" | "amber" | "red" | "green" | "blue" | "slate";

const VALUE_TONE: Record<Tone, string> = {
  navy: "text-[#102e50]",
  amber: "text-amber-700",
  red: "text-[#a8281c]",
  green: "text-emerald-700",
  blue: "text-[#0874aa]",
  slate: "text-slate-400",
};

const ICON_TONE: Record<Tone, string> = {
  navy: "bg-[#eff4ff] text-[#102e50]",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-[#a8281c]",
  green: "bg-emerald-50 text-emerald-700",
  blue: "bg-sky-50 text-[#0874aa]",
  slate: "bg-slate-50 text-slate-400",
};

const PILL_TONE: Record<Tone, string> = {
  navy: "bg-[#eff4ff] text-[#102e50] border-[#dee9fc]",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  red: "bg-red-50 text-[#a8281c] border-red-200",
  green: "bg-emerald-50 text-emerald-800 border-emerald-200",
  blue: "bg-sky-50 text-[#0874aa] border-sky-200",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
};

/* ---------- Tombol ---------- */

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102e50] disabled:opacity-50";

export const btnPrimary = `${BTN_BASE} bg-[#102e50] text-white shadow-xs hover:bg-[#0c233d]`;
export const btnSecondary = `${BTN_BASE} border border-[#dee9fc] bg-white text-[#102e50] shadow-xs hover:bg-[#eff4ff]`;

/* ---------- Header halaman ---------- */

interface DashboardHeaderProps {
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export function DashboardHeader({ eyebrow, title, description, actions }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-[#dee9fc] pb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#74777f]">
          <span>{eyebrow}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#f2af3e]" aria-hidden="true" />
          <span>PSPK</span>
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[#102e50] sm:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  );
}

/* ---------- Panel ---------- */

interface PanelProps {
  title: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  action?: { href: string; label: string };
  /** false → isi panel tanpa padding (untuk daftar yang membuat padding-nya sendiri) */
  padded?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Panel({
  title,
  icon: Icon,
  badge,
  action,
  padded = true,
  className = "",
  children,
}: PanelProps) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-[#dee9fc] bg-white shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#dee9fc] px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2">
          {Icon && <Icon className="h-4 w-4 shrink-0 text-[#f2af3e]" aria-hidden="true" />}
          <h2 className="truncate font-heading text-base font-bold text-[#102e50]">{title}</h2>
          {badge}
        </div>
        {action && (
          <Link
            href={action.href}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#102e50] hover:underline"
          >
            <span>{action.label}</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

/* ---------- Strip statistik ---------- */

export function StatStrip({ cols = 4, children }: { cols?: 3 | 4; children: React.ReactNode }) {
  const grid = cols === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  return (
    <div
      className={`grid ${grid} gap-px overflow-hidden rounded-xl border border-[#dee9fc] bg-[#dee9fc] shadow-xs`}
    >
      {children}
    </div>
  );
}

interface StatProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  hint?: React.ReactNode;
  tone?: Tone;
  icon: LucideIcon;
  href?: string;
  /** "md" untuk nilai panjang seperti nominal rupiah */
  size?: "lg" | "md";
}

export function Stat({ label, value, unit, hint, tone = "navy", icon: Icon, href, size = "lg" }: StatProps) {
  const valueSize = size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl";

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
            <span
              className={`font-heading font-extrabold leading-none tabular-nums ${valueSize} ${VALUE_TONE[tone]}`}
            >
              {value}
            </span>
            {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
          </p>
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ICON_TONE[tone]}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      {(hint || href) && (
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span className="min-w-0">{hint}</span>
          {href && (
            <ArrowRight
              className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#102e50]"
              aria-hidden="true"
            />
          )}
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block bg-white p-5 transition-colors hover:bg-[#f8f9ff] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#102e50]"
      >
        {content}
      </Link>
    );
  }
  return <div className="bg-white p-5">{content}</div>;
}

/* ---------- Pill & kosong ---------- */

export function Pill({ tone = "navy", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${PILL_TONE[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-6 py-9 text-center">
      <Icon className="mb-1 h-8 w-8 text-slate-300" aria-hidden="true" />
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {children && <div className="max-w-sm text-xs text-slate-500">{children}</div>}
    </div>
  );
}