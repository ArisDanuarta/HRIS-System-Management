"use client";

import React, { useState } from "react";
import { PspkLoader, PspkLogo, PspkLocku } from "./pspk-logo";

export interface LoginPageProps {
  currentApp: "hris" | "sysmgmt";
  hrisUrl?: string;
  sysmgmtUrl?: string;
  defaultEmail?: string;
  onSubmit?: (data: {
    email: string;
    password: string;
    remember: boolean;
  }) => Promise<{ error?: string } | void>;
  onSuccess?: () => void;
  forgotPasswordHref?: string;
  helpHref?: string;
}

type PortalKey = "hris" | "sysmgmt";

// Warna dari Brand Guideline PSPK: primer #102e50 / #f2af3e, sekunder #0874aa.
// onDark = versi lebih terang dari warna aksen supaya terbaca di atas navy
// (guideline mengizinkan mengubah saturation/kecerahan warna yang sama).
const PORTALS: Record<
  PortalKey,
  {
    tabLabel: string;
    name: string;
    kicker: string;
    description: string;
    blurb: string;
    accent: string;
    onDark: string;
    pillBg: string;
    pillText: string;
  }
> = {
  hris: {
    tabLabel: "Portal HRIS",
    name: "HRIS",
    kicker: "Akses pegawai",
    description: "Gunakan akun email PSPK Anda untuk mengelola kehadiran, cuti, dan data kepegawaian.",
    blurb: "Portal internal pegawai PSPK untuk kehadiran, cuti, dan administrasi kepegawaian.",
    accent: "#f2af3e",
    onDark: "#f2af3e",
    pillBg: "#fef3c7",
    pillText: "#805600",
  },
  sysmgmt: {
    tabLabel: "System Management",
    name: "System Management",
    kicker: "Akses administrator",
    description: "Gunakan akun administrator Anda untuk mengelola pengguna, hak akses, dan aset lembaga.",
    blurb: "Portal administrator PSPK untuk pengguna, hak akses, perangkat, dan audit log.",
    accent: "#0874aa",
    onDark: "#8fd0ee",
    pillBg: "#dbeafe",
    pillText: "#0b4f73",
  },
};

// Judul memakai Lora (guideline). Muat font lewat next/font di layout dan
// sambungkan ke variabel --font-lora. Tanpa itu otomatis jatuh ke serif bawaan.
const HEADING_FONT = 'var(--font-lora, Lora, Georgia, "Times New Roman", serif)';

export function LoginPage({
  currentApp = "hris",
  hrisUrl = "http://localhost:3001",
  sysmgmtUrl = "http://localhost:3002",
  defaultEmail = "",
  onSubmit,
  onSuccess,
  forgotPasswordHref = "/bantuan#lupa-password",
  helpHref = "/bantuan",
}: LoginPageProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  // Active portal tab state (enables instant animated sliding indicator)
  const [activeTab, setActiveTab] = useState<PortalKey>(currentApp);
  const [isSwitching, setIsSwitching] = useState(false);
  const [loaderVariant, setLoaderVariant] = useState<"draw" | "loop">("draw");

  const hasNavigatedRef = React.useRef(false);
  const lagTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const fallbackTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const holdTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Bersihkan semua timer saat unmount
  React.useEffect(() => {
    return () => {
      if (lagTimerRef.current) clearTimeout(lagTimerRef.current);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const triggerNavigation = React.useCallback((targetUrl: string) => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    // Eksekusi perpindahan halaman
    window.location.href = targetUrl;

    // Jika jaringan lambat / lag (halaman belum ter-unload setelah 800ms),
    // aktifkan animasi loop agar logo terus bergerak dan pengguna mengetahui sistem sedang menunggu server
    lagTimerRef.current = setTimeout(() => {
      setLoaderVariant("loop");
    }, 800);
  }, []);

  // Form states: "idle" | "loading" | "error"
  const [formState, setFormState] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const isHris = activeTab === "hris";
  const portal = PORTALS[activeTab];

  const handleSwitchPortal = (target: PortalKey) => {
    if (target === currentApp && !isSwitching) return;
    if (isSwitching) return;

    setActiveTab(target);
    setLoaderVariant("draw");
    setIsSwitching(true);
    hasNavigatedRef.current = false;

    const targetUrl = target === "hris" ? `${hrisUrl}/login` : `${sysmgmtUrl}/login`;

    // Cek preferensi pengguna untuk reduced-motion (animasi statis)
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      holdTimerRef.current = setTimeout(() => {
        triggerNavigation(targetUrl);
      }, 250);
      return;
    }

    // Fallback pengaman maksimal jika event animasi terhambat (misal tab tidak aktif di background):
    // Durasi draw normal ~1.46s, batas pengaman diset 2400ms
    fallbackTimerRef.current = setTimeout(() => {
      triggerNavigation(targetUrl);
    }, 2400);
  };

  const handleAnimationComplete = () => {
    if (hasNavigatedRef.current) return;

    const targetUrl = activeTab === "hris" ? `${hrisUrl}/login` : `${sysmgmtUrl}/login`;

    // Animasi gambar garis logo telah selesai 100% (keempat bentuk utuh sempurna).
    // Berikan jeda 180ms agar bentuk logo utuh terlihat sejenak sebelum browser berpindah halaman.
    holdTimerRef.current = setTimeout(() => {
      triggerNavigation(targetUrl);
    }, 180);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setFormState("loading");

    if (onSubmit) {
      try {
        const result = await onSubmit({ email, password, remember });
        if (result && result.error) {
          setErrorMessage(result.error);
          setFormState("error");
        } else {
          setFormState("idle");
          if (onSuccess) onSuccess();
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Terjadi kesalahan saat memproses autentikasi.";
        setErrorMessage(msg);
        setFormState("error");
      }
    }
  };

  return (
    <div className="flex min-h-dvh w-full flex-col bg-[#f8f9ff] text-[#121c2a] antialiased selection:bg-[#f2af3e]/30 lg:flex-row">
      {/* Loading overlay animasi logo PSPK saat pengguna mengeklik tab perpindahan portal */}
      {isSwitching && (
        <PspkLoader
          fullScreen={true}
          variant={loaderVariant}
          onComplete={handleAnimationComplete}
          label={
            isHris ? "Beralih ke Portal HRIS..." : "Beralih ke Portal System Management..."
          }
        />
      )}

      {/* Progress bar tipis saat berpindah portal */}
      <div
        className={`pointer-events-none fixed left-0 right-0 top-0 z-50 h-1 overflow-hidden transition-opacity duration-300 ${
          isSwitching ? "opacity-100" : "opacity-0"
        }`}
        style={{ background: `linear-gradient(90deg, #102e50 0%, ${portal.accent} 100%)` }}
      >
        <div className="animate-shimmer-beam h-full w-full bg-white/40" />
      </div>

      {/* PANEL KIRI: identitas PSPK (hanya layar besar). Navy polos + logogram pudar. */}
      <aside
        className="relative hidden overflow-hidden bg-[#102e50] text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-[46%] lg:flex-col lg:justify-between lg:p-12"
        style={{ backgroundColor: "#102e50", color: "#ffffff" }}
      >
        {/* Logogram besar sebagai watermark. Merakit sekali saat halaman dibuka. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -right-28 select-none"
          style={{ opacity: 0.08, filter: "brightness(0) invert(1)" }}
        >
          <PspkLogo variant="assemble" size={640} title={null} className="overflow-visible" />
        </div>

        <div className="relative z-10">
          <PspkLockup variant="horizontal" tone="white" size={60} />
        </div>

        <div key={`copy-${activeTab}`} className="relative z-10 max-w-md animate-in fade-in duration-500">
          <p
            className="mb-4 text-xs font-bold uppercase tracking-[0.18em]"
            style={{ color: portal.onDark }}
          >
            {portal.kicker}
          </p>
          <h1
            className="mb-4 text-[40px] font-bold leading-[1.15] text-white"
            style={{ fontFamily: HEADING_FONT }}
          >
            Equitable Education for{" "}
            <span style={{ color: "#f2af3e" }}>Every Child</span>
          </h1>
          <p className="text-[15px] leading-relaxed text-[#d6e0f0]">{portal.blurb}</p>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-[#aebdd6]">
          <span>#BerpihakKepadaAnak</span>
          <a
            href="https://pspk.id"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-white"
          >
            pspk.id
          </a>
        </div>
      </aside>

      {/* PANEL KANAN: area autentikasi */}
      <main className="flex flex-1 flex-col bg-[#f8f9ff] p-6 sm:p-8 lg:p-10 xl:p-12">
        {/* Header: pemilih portal + bantuan */}
        <div className="flex w-full items-center justify-between gap-4 pb-2">
          <div className="relative grid w-72 select-none grid-cols-2 rounded-xl border border-[#c8d8f0] bg-[#e6eeff]/90 p-1 sm:w-[330px]">
            {/* Penanda aktif yang bergeser */}
            <div
              className="pointer-events-none absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-lg bg-[#102e50] shadow-[0_4px_12px_rgba(16,46,80,0.25)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{ left: isHris ? "4px" : "calc(50% + 0px)" }}
            />

            {/* HRIS Tab */}
            <button
              type="button"
              onClick={() => handleSwitchPortal("hris")}
              aria-pressed={isHris}
              className={`relative z-10 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                isHris ? "text-white" : "text-[#43474e] hover:text-[#102e50]"
              }`}
              title="Pindah ke Login Portal HRIS"
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full bg-[#f2af3e] transition-all duration-300 ${
                  isHris ? "scale-100 opacity-100" : "scale-50 opacity-0"
                }`}
              />
              <svg
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="truncate">Portal HRIS</span>
            </button>

            {/* SysMgmt Tab */}
            <button
              type="button"
              onClick={() => handleSwitchPortal("sysmgmt")}
              aria-pressed={!isHris}
              className={`relative z-10 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                !isHris ? "text-white" : "text-[#43474e] hover:text-[#102e50]"
              }`}
              title="Pindah ke Login System Management"
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full bg-[#8fd0ee] transition-all duration-300 ${
                  !isHris ? "scale-100 opacity-100" : "scale-50 opacity-0"
                }`}
              />
              <svg
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span className="truncate">System Management</span>
            </button>
          </div>

          <a
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5b6675] transition-colors duration-200 hover:text-[#102e50] hover:underline"
            href={helpHref}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Bantuan</span>
          </a>
        </div>

        {/* Kartu form */}
        <div className="mx-auto my-auto w-full max-w-md py-6">
          <div className="mb-7 flex justify-center">
            <PspkLockup variant="vertical" tone="color" size={84} />
          </div>

          <div
            className={`relative overflow-hidden rounded-xl border border-[#e6eeff] bg-white p-6 shadow-sm transition-transform duration-300 sm:p-8 ${
              isSwitching ? "scale-[0.985]" : "scale-100"
            }`}
          >
            <div className="mb-6">
              <span
                className="mb-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300"
                style={{ backgroundColor: portal.pillBg, color: portal.pillText }}
              >
                {portal.name}
              </span>
              <h2
                className="mb-1 text-2xl font-bold text-[#102e50] sm:text-[28px]"
                style={{ fontFamily: HEADING_FONT }}
              >
                Masuk ke {portal.name}
              </h2>
              <p className="text-sm text-[#43474e]">{portal.description}</p>
            </div>

            {/* Banner error */}
            {formState === "error" && (
              <div
                role="alert"
                className="mb-5 flex animate-in items-start gap-3 rounded bg-[#ffdad6] p-3.5 text-[#93000a] duration-300 fade-in slide-in-from-top-2"
              >
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#ba1a1a]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-bold leading-tight text-[#ba1a1a]">
                    Autentikasi gagal
                  </p>
                  <p className="mt-0.5 text-sm text-[#93000a]">
                    {errorMessage || "Email atau kata sandi yang Anda masukkan tidak sesuai."}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Tutup pesan kesalahan"
                  className="text-[#ba1a1a] transition-opacity hover:opacity-75"
                  onClick={() => setFormState("idle")}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="flex items-center gap-1 text-sm font-medium text-[#121c2a]"
                    htmlFor="email-field"
                  >
                    Alamat email PSPK
                    <span className="text-[#ba1a1a]" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <span className="text-[11px] text-[#74777f]">Domain resmi @pspk.id</span>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#43474e]">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    id="email-field"
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@pspk.id"
                    className="h-11 w-full rounded border border-[#adc8f2] bg-white pl-11 pr-4 text-sm text-[#121c2a] shadow-xs transition-all duration-200 placeholder:text-[#74777f] focus:outline-none focus:ring-2 focus:ring-[#102e50]"
                  />
                </div>
              </div>

              {/* Kata sandi */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="flex items-center gap-1 text-sm font-medium text-[#121c2a]"
                    htmlFor="password-field"
                  >
                    Kata sandi
                    <span className="text-[#ba1a1a]" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <a
                    className="text-xs font-semibold text-[#805600] hover:underline"
                    href={forgotPasswordHref}
                  >
                    Lupa kata sandi?
                  </a>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#43474e]">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <input
                    id="password-field"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                    onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                    onBlur={() => setCapsLock(false)}
                    aria-describedby={capsLock ? "caps-hint" : undefined}
                    placeholder="Masukkan kata sandi"
                    className="h-11 w-full rounded border border-[#adc8f2] bg-white pl-11 pr-12 text-sm text-[#121c2a] shadow-xs transition-all duration-200 placeholder:text-[#74777f] focus:outline-none focus:ring-2 focus:ring-[#102e50]"
                  />
                  <button
                    id="toggle-password-btn"
                    type="button"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#43474e] transition-transform duration-150 hover:text-[#121c2a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#102e50] active:scale-90"
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {capsLock && (
                  <p id="caps-hint" role="status" className="text-xs font-medium text-[#805600]">
                    Caps Lock sedang aktif.
                  </p>
                )}
              </div>

              {/* Ingat saya */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex cursor-pointer select-none items-center gap-2.5">
                  <input
                    id="remember-me"
                    name="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 transition-transform duration-150 focus:ring-[#f2af3e] active:scale-95"
                    style={{ accentColor: "#102e50" }}
                  />
                  <span className="text-sm text-[#121c2a]">Ingat saya di perangkat ini</span>
                </label>
                {remember && (
                  <span className="hidden text-[11px] text-[#74777f] sm:inline">Sesi 30 hari</span>
                )}
              </div>

              {/* Tombol utama */}
              {formState === "loading" ? (
                <button
                  id="submit-btn-loading"
                  type="button"
                  disabled
                  className="mt-1 flex h-11 w-full cursor-wait items-center justify-center gap-3 rounded bg-[#102e50]/85 px-6 text-sm font-semibold tracking-wide text-white"
                >
                  <svg
                    className="h-4 w-4 animate-spin text-[#f2af3e]"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="opacity-90"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Memverifikasi...</span>
                </button>
              ) : (
                <button
                  id="submit-btn-idle"
                  type="submit"
                  className="mt-1 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded bg-[#102e50] px-6 text-sm font-semibold tracking-wide text-white shadow-sm transition-all duration-200 hover:bg-[#001934] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#102e50] focus:ring-offset-2 active:scale-[0.99]"
                >
                  <span>Masuk ke {portal.name}</span>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex w-full flex-col items-center justify-between gap-3 border-t border-[#dee9fc] pt-3 text-xs text-[#43474e] sm:flex-row">
          <div className="text-center text-[#5b6675] sm:text-left">
            © PSPK • Pusat Studi Pendidikan dan Kebijakan
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <a className="transition-colors duration-150 hover:text-[#001934]" href="/bantuan#keamanan">
              Kebijakan privasi
            </a>
            <span className="text-[#c4c6cf]" aria-hidden="true">
              •
            </span>
            <a className="transition-colors duration-150 hover:text-[#001934]" href="/bantuan#keamanan">
              Protokol keamanan
            </a>
            <span className="text-[#c4c6cf]" aria-hidden="true">
              •
            </span>
            <a className="transition-colors duration-150 hover:text-[#001934]" href="/bantuan#kontak">
              Bantuan IT
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}