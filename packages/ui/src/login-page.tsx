"use client";

import React, { useState } from "react";

export interface LoginPageProps {
  appName?: string;
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

export function LoginPage({
  appName = "PSPK Platform",
  defaultEmail = "",
  onSubmit,
  onSuccess,
  forgotPasswordHref = "#lupa-password",
  helpHref = "#bantuan",
}: LoginPageProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Form states: "idle" | "loading" | "error"
  const [formState, setFormState] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

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
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses autentikasi.";
        setErrorMessage(msg);
        setFormState("error");
      }
    }
  };

  return (
    <div
      className="w-full min-h-screen flex flex-col lg:flex-row bg-[#f8f9ff] text-[#121c2a] antialiased selection:bg-[#feba48]/30"
      style={{ minHeight: "100vh" }}
    >
      {/* LEFT PANEL: Institutional Navy Brand Identity */}
      <div
        className="relative w-full lg:w-[46%] min-h-[520px] lg:min-h-screen bg-[#102e50] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden"
        style={{ backgroundColor: "#102e50", color: "#ffffff" }}
      >
        {/* Ambient Mathematical Geometry (Vector Lines & Deep Navy Contours) */}
        <div className="absolute inset-0 pointer-events-none select-none opacity-40">
          <svg className="w-full h-full" fill="none" viewBox="0 0 680 960" xmlns="http://www.w3.org/2000/svg">
            <circle cx="580" cy="180" r="320" stroke="#feba48" strokeDasharray="3 6" strokeOpacity="0.25" strokeWidth="1" />
            <circle cx="580" cy="180" r="460" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="0.75" />
            <path d="M-100 850L750 320" stroke="#feba48" strokeOpacity="0.2" strokeWidth="0.75" />
            <path d="M-80 920L780 380" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.5" />
            <polygon fill="#feba48" fillOpacity="0.25" points="420,40 430,70 460,80 430,90 420,120 410,90 380,80 410,70" />
            <circle cx="120" cy="620" r="180" stroke="#feba48" strokeOpacity="0.18" strokeWidth="1.2" />
            <path d="M50 780C210 650 390 680 540 860" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1" />
            <rect height="160" rx="4" stroke="#feba48" strokeOpacity="0.2" strokeWidth="0.5" width="160" x="40" y="80" />
          </svg>
        </div>

        {/* Top Header: Monogram & Identity */}
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white p-2 shadow-sm flex items-center justify-center overflow-hidden">
              <img
                alt="PSPK Logo Monogram"
                className="w-full h-full object-contain"
                src="/images/pspk-logo.png"
                onError={(e) => {
                  // Fallback to high-res remote logo if local not yet loaded
                  const target = e.target as HTMLImageElement;
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = "true";
                    target.src =
                      "https://lh3.googleusercontent.com/aida/AEtjO1X2Y-r2loLeUuBwqlHaZoq9t68fFcf1AWz2PeodD3-vWrMPB4rYktV4GejyIjDqF7wAqcXLuzt5TKfS_VLcjmTVtZNYrvuPpad7UyM95eHD0ZZjZE4upc9h9Srf64tFa7t1yJmSbHpdpSngAzk4ELwtcPIfpIN3rNxNbY4mEziQqRdTCc4tEviFPPD5WOLkaQix_GdBEaRLpwHNEj4VVxEVFcplPC307dKB96E-xkL9L-2wytejg7loIt8";
                  }
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg tracking-wide text-white uppercase leading-tight font-bold">PSPK</span>
              <span className="text-[11px] text-[#ffddb0] tracking-widest uppercase font-semibold">
                Platform Tata Kelola Terpadu
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white/10 max-w-fit mt-2">
            <span className="w-2 h-2 rounded-full bg-[#feba48] animate-pulse"></span>
            <span className="text-[11px] text-[#d9e3f6] tracking-wider uppercase font-semibold">
              Portal Internal Lembaga • {appName}
            </span>
          </div>
        </div>

        {/* Center Copy: Tagline & Mission */}
        <div className="relative z-10 py-12 lg:py-0 my-auto max-w-lg">
          <p className="text-[13px] text-[#ffddb0] mb-3 tracking-widest uppercase font-semibold">
            Integritas • Kebijakan • Dampak
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-[46px] text-white leading-tight mb-6 font-serif">
            Satu platform untuk pengelolaan SDM dan sistem PSPK.
          </h1>
          <p className="text-base sm:text-lg text-[#d9e3f6] leading-relaxed font-light">
            Akses terpusat untuk analisis data kebijakan pendidikan, kolaborasi lintas divisi riset, dan administrasi
            kelembagaan Pusat Studi Pendidikan dan Kebijakan.
          </p>

          {/* Metric / Institutional Fact Highlight */}
          <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xl sm:text-2xl text-[#ffddb0] font-bold">2014 – Kini</div>
              <div className="text-[11px] text-[#d9e3f6] uppercase mt-1 tracking-wider">Riset Berbasis Bukti</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl text-[#ffddb0] font-bold">256-Bit TLS</div>
              <div className="text-[11px] text-[#d9e3f6] uppercase mt-1 tracking-wider">Enkripsi Data Kredensial</div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Signals */}
        <div className="relative z-10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-white/15 text-[#d9e3f6]">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#feba48]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
            <span className="text-[13px] text-white font-medium">Aman Terenkripsi • Protokol Otentikasi PSPK</span>
          </div>
          <span className="text-[11px] text-[#d9e3f6]/80 font-mono">Versi 1.0.0-prod</span>
        </div>
      </div>

      {/* RIGHT PANEL: Authentication Workspace */}
      <div
        className="w-full lg:w-[54%] flex flex-col justify-between p-6 sm:p-10 lg:p-16 bg-[#f8f9ff]"
        style={{ backgroundColor: "#f8f9ff" }}
      >
        {/* Top Secondary Bar / Context Header */}
        <div className="w-full flex items-center justify-between pb-6">
          <div className="flex items-center gap-2 text-[#43474e]">
            <svg className="w-5 h-5 text-[#102e50]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-[13px] font-semibold tracking-wide">Pusat Studi Pendidikan dan Kebijakan</span>
          </div>
          <a
            className="inline-flex items-center gap-1.5 text-[13px] text-[#102e50] hover:text-[#805600] font-semibold transition-colors"
            href={helpHref}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Pusat Bantuan</span>
          </a>
        </div>

        {/* Main Central Card Area */}
        <div className="w-full max-w-xl mx-auto my-auto py-6">
          {/* Authentication Card */}
          <div className="bg-white rounded-xl p-8 sm:p-10 shadow-sm border border-[#e6eeff]/70 transition-all duration-200">
            {/* Card Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-widest text-[#805600] uppercase">
                  Masuk SSO Lembaga
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#dee9fc] text-[#102e50] font-mono">
                  ENV: ID-JKT-01
                </span>
              </div>
              <h2 className="text-3xl text-[#102e50] mt-1 mb-2 font-serif font-semibold">Masuk</h2>
              <p className="text-sm text-[#43474e]">
                Silakan masukkan kredensial akun PSPK Anda untuk melanjutkan ke sistem.
              </p>
            </div>

            {/* Inline Error Banner Frame (Maroon Tint Container) */}
            {formState === "error" && (
              <div className="mb-6 p-4 rounded bg-[#ffdad6] text-[#93000a] flex items-start gap-3 transition-all duration-200 animate-in fade-in">
                <svg className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#ba1a1a] leading-tight">Autentikasi Gagal</p>
                  <p className="text-sm text-[#93000a] mt-0.5">
                    {errorMessage || "Email atau kata sandi yang Anda masukkan tidak sesuai."}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Tutup pesan kesalahan"
                  className="text-[#ba1a1a] hover:opacity-75 transition-opacity"
                  onClick={() => setFormState("idle")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}

            {/* Login Form */}
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-[#121c2a] font-medium flex items-center gap-1" htmlFor="email-field">
                    Alamat Email PSPK
                    <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <span className="text-[11px] text-[#74777f] font-mono">Domain resmi @pspk.or.id</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#43474e]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email-field"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama.pegawai@pspk.or.id"
                    className="w-full h-11 pl-11 pr-4 rounded bg-white text-[#121c2a] text-sm placeholder:text-[#74777f] border border-[#adc8f2] focus:outline-none focus:ring-2 focus:ring-[#102e50] shadow-sm transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-[#121c2a] font-medium flex items-center gap-1" htmlFor="password-field">
                    Kata Sandi
                    <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <a
                    className="text-[13px] text-[#805600] hover:underline font-semibold"
                    href={forgotPasswordHref}
                  >
                    Lupa password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#43474e]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <input
                    id="password-field"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun"
                    className="w-full h-11 pl-11 pr-12 rounded bg-white text-[#121c2a] text-sm placeholder:text-[#74777f] border border-[#adc8f2] focus:outline-none focus:ring-2 focus:ring-[#102e50] shadow-sm transition-all"
                  />
                  <button
                    id="toggle-password-btn"
                    type="button"
                    aria-label="Tampilkan atau sembunyikan kata sandi"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#43474e] hover:text-[#121c2a] focus:outline-none"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Trust Device Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    id="remember-me"
                    name="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded text-[#102e50] border-gray-300 focus:ring-[#feba48] cursor-pointer"
                    style={{ accentColor: "#102e50" }}
                  />
                  <span className="text-sm text-[#121c2a]">Ingat saya di perangkat ini</span>
                </label>
                <div className="hidden sm:flex items-center gap-1 text-[#74777f] text-[11px]">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Sesi 30 hari</span>
                </div>
              </div>

              {/* Primary Action Button: Idle vs Loading State */}
              {formState === "loading" ? (
                <button
                  id="submit-btn-loading"
                  type="button"
                  disabled
                  className="w-full h-12 mt-2 px-6 rounded bg-[#102e50]/85 text-white text-sm sm:text-base font-semibold tracking-wide flex items-center justify-center gap-3 cursor-wait shadow-sm"
                >
                  <svg className="animate-spin h-5 w-5 text-[#ffddb0]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path
                      className="opacity-90"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Memverifikasi Kredensial...</span>
                </button>
              ) : (
                <button
                  id="submit-btn-idle"
                  type="submit"
                  className="w-full h-12 mt-2 px-6 rounded bg-[#102e50] hover:bg-[#001934] active:scale-[0.99] text-white text-sm sm:text-base font-semibold tracking-wide flex items-center justify-center gap-2 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#102e50]"
                >
                  <span>Masuk</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              )}
            </form>

            {/* Dual Verification & Alternative Assistance Note */}
            <div className="mt-8 pt-6 border-t border-[#e6eeff] flex flex-col sm:flex-row items-center justify-between gap-3 text-[#43474e] text-[13px]">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#feba48]" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Otorisasi 2-Faktor (2FA) Aktif
              </span>
              <span className="font-mono text-xs">ID Sesi: 9942-AUTH-IDN</span>
            </div>
          </div>
        </div>

        {/* Small Institutional Footer */}
        <footer className="w-full pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#43474e] border-t border-[#dee9fc] text-[13px]">
          <div className="text-center sm:text-left">
            © PSPK • Pusat Studi Pendidikan dan Kebijakan. Hak cipta dilindungi undang-undang.
          </div>
          <div className="flex items-center gap-6">
            <a className="hover:text-[#001934] transition-colors" href="#keamanan">
              Kebijakan Privasi
            </a>
            <span className="text-[#c4c6cf]">•</span>
            <a className="hover:text-[#001934] transition-colors" href="#syarat">
              Protokol Keamanan
            </a>
            <span className="text-[#c4c6cf]">•</span>
            <a className="hover:text-[#001934] transition-colors" href="#kontak-it">
              Bantuan IT PSPK
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
