"use client";

import React, { useState } from "react";

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

export function LoginPage({
  currentApp = "hris",
  hrisUrl = "http://localhost:3001",
  sysmgmtUrl = "http://localhost:3002",
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

  // Active portal tab state (enables instant animated sliding indicator)
  const [activeTab, setActiveTab] = useState<"hris" | "sysmgmt">(currentApp);
  const [isSwitching, setIsSwitching] = useState(false);

  // Form states: "idle" | "loading" | "error"
  const [formState, setFormState] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const isHris = activeTab === "hris";

  const handleSwitchPortal = (target: "hris" | "sysmgmt") => {
    if (target === currentApp && !isSwitching) return;
    setActiveTab(target);
    setIsSwitching(true);

    const targetUrl = target === "hris" ? `${hrisUrl}/login` : `${sysmgmtUrl}/login`;
    // Allow the fluid transition animation to play smoothly before navigating
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 420);
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
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses autentikasi.";
        setErrorMessage(msg);
        setFormState("error");
      }
    }
  };

  return (
    <div
      className="w-full h-screen max-h-screen overflow-hidden flex flex-col lg:flex-row bg-[#f8f9ff] text-[#121c2a] antialiased selection:bg-[#feba48]/30"
      style={{ height: "100vh", maxHeight: "100vh" }}
    >
      {/* Top transition progress bar with radiant glowing beam */}
      <div
        className={`fixed top-0 left-0 right-0 h-1 z-50 overflow-hidden transition-opacity duration-300 ${
          isSwitching ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          background: isHris
            ? "linear-gradient(90deg, #102e50 0%, #feba48 50%, #f2af3e 100%)"
            : "linear-gradient(90deg, #102e50 0%, #60a5fa 50%, #3b82f6 100%)",
        }}
      >
        <div className="w-full h-full animate-shimmer-beam bg-white/40 blur-[1px]" />
      </div>

      {/* LEFT PANEL: Institutional Navy Brand Identity with Dynamic Ambient Orbs */}
      <div
        className="relative w-full lg:w-[46%] h-auto lg:h-full bg-[#102e50] text-white flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12 overflow-hidden transition-colors duration-700"
        style={{ backgroundColor: "#102e50", color: "#ffffff" }}
      >
        {/* Dynamic Atmospheric Ambient Glow Orbs */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none filter blur-3xl transition-all duration-700 ease-out"
          style={{
            background: isHris
              ? "radial-gradient(circle, rgba(254, 186, 72, 0.22) 0%, rgba(16, 46, 80, 0) 70%)"
              : "radial-gradient(circle, rgba(96, 165, 250, 0.25) 0%, rgba(16, 46, 80, 0) 70%)",
          }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full pointer-events-none filter blur-2xl transition-all duration-700 ease-out"
          style={{
            background: isHris
              ? "radial-gradient(circle, rgba(242, 175, 62, 0.16) 0%, rgba(16, 46, 80, 0) 70%)"
              : "radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, rgba(16, 46, 80, 0) 70%)",
          }}
        />

        {/* Ambient Mathematical Geometry (Vector Lines with Smooth Micro-Rotations) */}
        <div className="absolute inset-0 pointer-events-none select-none opacity-40">
          <svg className="w-full h-full" fill="none" viewBox="0 0 680 960" xmlns="http://www.w3.org/2000/svg">
            <circle
              cx="580"
              cy="180"
              r="320"
              stroke={isHris ? "#feba48" : "#60a5fa"}
              strokeDasharray="4 8"
              strokeOpacity="0.35"
              strokeWidth="1.2"
              className="origin-[580px_180px] animate-[spin_120s_linear_infinite] transition-colors duration-500"
            />
            <circle cx="580" cy="180" r="460" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="0.75" />
            <path
              d="M-100 850L750 320"
              stroke={isHris ? "#feba48" : "#60a5fa"}
              strokeOpacity="0.22"
              strokeWidth="0.75"
              className="transition-colors duration-500"
            />
            <path d="M-80 920L780 380" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.5" />
            <polygon
              fill={isHris ? "#feba48" : "#60a5fa"}
              fillOpacity="0.32"
              points="420,40 430,70 460,80 430,90 420,120 410,90 380,80 410,70"
              className="animate-pulse transition-colors duration-500"
              style={{ animationDuration: "4s" }}
            />
            <circle
              cx="120"
              cy="620"
              r="180"
              stroke={isHris ? "#feba48" : "#60a5fa"}
              strokeOpacity="0.2"
              strokeWidth="1.2"
              className="transition-colors duration-500"
            />
            <path d="M50 780C210 650 390 680 540 860" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1" />
            <rect
              height="160"
              rx="4"
              stroke={isHris ? "#feba48" : "#60a5fa"}
              strokeOpacity="0.22"
              strokeWidth="0.5"
              width="160"
              x="40"
              y="80"
              className="transition-colors duration-500"
            />
          </svg>
        </div>

        {/* Top Header: Official Logo, Identity & App Portal Tag */}
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 px-3.5 py-1.5 rounded-xl bg-white shadow-md flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105 border border-white/20">
              <img
                alt="Logo Resmi PSPK"
                className="h-8 w-auto object-contain"
                src="/images/logo_pspk_horizontal_trimmed.png"
              />
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="flex flex-col">
              <span
                key={activeTab}
                className={`text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  isHris ? "text-[#ffddb0]" : "text-[#93c5fd]"
                }`}
              >
                {isHris ? "HRIS Portal" : "System Management"}
              </span>
              <span className="text-[10px] text-white/70 tracking-wider uppercase font-medium">
                Platform Tata Kelola Terpadu
              </span>
            </div>
          </div>
        </div>

        {/* Center Copy: Distinct App Mission & Value with Staggered Transitions */}
        <div
          key={`center-${activeTab}`}
          className="relative z-10 my-auto py-3 max-w-lg transition-all duration-500 animate-in fade-in slide-in-from-left-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`w-1.5 h-1.5 rounded-full animate-ping ${
                isHris ? "bg-[#feba48]" : "bg-[#60a5fa]"
              }`}
            />
            <p className={`text-xs tracking-widest uppercase font-semibold transition-colors duration-300 ${isHris ? "text-[#ffddb0]" : "text-[#93c5fd]"}`}>
              {isHris ? "Manajemen SDM • Kesejahteraan • Kinerja" : "Keamanan • Hak Akses • Integritas Sistem"}
            </p>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-[36px] text-white leading-tight mb-3 font-serif transition-all duration-300">
            {isHris
              ? "Pengelolaan data SDM, absensi, dan cuti terpadu PSPK."
              : "Tata kelola pengguna, kontrol akses RBAC, dan audit log."}
          </h1>
          <p className="text-xs sm:text-sm text-[#d9e3f6] leading-relaxed font-light">
            {isHris
              ? "Akses mandiri administrasi kepegawaian, pengajuan izin cuti, evaluasi kinerja, dan rekam kehadiran tim riset Pusat Studi Pendidikan dan Kebijakan."
              : "Pusat kendali izin peran & permission (RBAC), inventarisasi perangkat dan aset lembaga, manajemen SOP, serta pencatatan audit log terenkripsi."}
          </p>

          {/* Metric / Distinct Highlights */}
          <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-xs transition-transform duration-300 hover:translate-y-[-2px] hover:bg-white/10">
              <div className={`text-lg sm:text-xl font-bold transition-colors duration-300 ${isHris ? "text-[#ffddb0]" : "text-[#93c5fd]"}`}>
                {isHris ? "SDM Terpadu" : "RBAC 5 Peran"}
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#d9e3f6] uppercase mt-0.5 tracking-wider">
                {isHris ? "Manajemen Pegawai & Cuti" : "Kontrol Akses Multi-Level"}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-xs transition-transform duration-300 hover:translate-y-[-2px] hover:bg-white/10">
              <div className={`text-lg sm:text-xl font-bold transition-colors duration-300 ${isHris ? "text-[#ffddb0]" : "text-[#93c5fd]"}`}>
                {isHris ? "256-Bit TLS" : "Audit Trail"}
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#d9e3f6] uppercase mt-0.5 tracking-wider">
                {isHris ? "Enkripsi Kredensial" : "Log Terenkripsi"}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Signals */}
        <div className="relative z-10 pt-3 flex items-center justify-between gap-4 border-t border-white/15 text-[#d9e3f6]">
          <div className="flex items-center gap-2">
            <svg className={`w-3.5 h-3.5 transition-colors duration-300 ${isHris ? "text-[#feba48]" : "text-[#60a5fa]"}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
            <span className="text-[11px] text-white/90 font-medium">
              {isHris ? "Keamanan Data Pegawai PSPK" : "Protokol Keamanan Sistem PSPK"}
            </span>
          </div>
          <span className="text-[10px] text-[#d9e3f6]/70 font-mono">v1.0.0-prod</span>
        </div>
      </div>

      {/* RIGHT PANEL: Authentication Workspace & Animated Portal Switcher */}
      <div
        className="w-full lg:w-[54%] h-full flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12 bg-[#f8f9ff] overflow-y-auto lg:overflow-hidden"
        style={{ backgroundColor: "#f8f9ff" }}
      >
        {/* Top Header: Animated Sliding Segmented Control & Help Link */}
        <div className="w-full flex items-center justify-between pb-2">
          {/* Animated Segmented Control with Tactile Sliding Pill Indicator */}
          <div className="relative grid grid-cols-2 p-1 rounded-xl bg-[#e6eeff]/90 backdrop-blur-sm border border-[#c8d8f0] shadow-xs select-none w-72 sm:w-[330px]">
            {/* Sliding Active Pill Background with Spring Physics */}
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-[#102e50] shadow-[0_4px_12px_rgba(16,46,80,0.25)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
              style={{
                left: activeTab === "hris" ? "4px" : "calc(50% + 0px)",
              }}
            />

            {/* HRIS Tab */}
            <button
              type="button"
              onClick={() => handleSwitchPortal("hris")}
              className={`relative z-10 w-full flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === "hris"
                  ? "text-white"
                  : "text-[#43474e] hover:text-[#102e50] hover:scale-[1.01]"
              }`}
              title="Pindah ke Login Portal HRIS"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 ${
                  activeTab === "hris"
                    ? "bg-[#feba48] shadow-[0_0_8px_#feba48] opacity-100 scale-100 animate-pulse"
                    : "opacity-0 scale-50"
                }`}
              />
              <svg className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="truncate">Portal HRIS</span>
            </button>

            {/* SysMgmt Tab */}
            <button
              type="button"
              onClick={() => handleSwitchPortal("sysmgmt")}
              className={`relative z-10 w-full flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === "sysmgmt"
                  ? "text-white"
                  : "text-[#43474e] hover:text-[#102e50] hover:scale-[1.01]"
              }`}
              title="Pindah ke Login System Management"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 ${
                  activeTab === "sysmgmt"
                    ? "bg-[#60a5fa] shadow-[0_0_8px_#60a5fa] opacity-100 scale-100 animate-pulse"
                    : "opacity-0 scale-50"
                }`}
              />
              <svg className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="truncate">System Management</span>
            </button>
          </div>

          <a
            className="inline-flex items-center gap-1.5 text-xs text-[#5b6675] hover:text-[#102e50] font-semibold transition-colors duration-200 hover:underline"
            href={helpHref}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Bantuan</span>
          </a>
        </div>

        {/* Main Central Card Area */}
        <div className="w-full max-w-lg mx-auto my-auto py-2">
          {/* Authentication Card with Transition Feedback */}
          <div
            className={`relative bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-[#e6eeff]/80 transition-all duration-300 overflow-hidden ${
              isSwitching ? "scale-[0.985] shadow-xs" : "scale-100 hover:shadow-md"
            }`}
          >
            {/* Transition Handshake Overlay */}
            {isSwitching && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm transition-all duration-300 animate-in fade-in zoom-in-95">
                <div className="relative flex items-center justify-center mb-3">
                  <div
                    className={`absolute w-14 h-14 rounded-full animate-ping opacity-30 ${
                      activeTab === "sysmgmt" ? "bg-[#60a5fa]" : "bg-[#feba48]"
                    }`}
                  />
                  <div className="w-12 h-12 rounded-full bg-[#102e50] flex items-center justify-center shadow-lg text-white">
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path
                        className={`opacity-90 fill-current ${activeTab === "sysmgmt" ? "text-[#60a5fa]" : "text-[#feba48]"}`}
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-center px-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#102e50]">
                    Mengalihkan Akses Portal
                  </p>
                  <h3 className="text-base font-serif font-bold text-[#102e50] mt-0.5">
                    Menghubungkan ke {activeTab === "sysmgmt" ? "System Management" : "Portal HRIS"}...
                  </h3>
                  <p className="text-[11px] text-[#5b6675] mt-1">
                    Sistem Tata Kelola Terpadu PSPK
                  </p>
                </div>
                {/* Micro Loading Beam Indicator */}
                <div className="w-36 h-1 bg-[#e6eeff] rounded-full mt-4 overflow-hidden">
                  <div
                    className={`h-full animate-shimmer-beam rounded-full ${
                      activeTab === "sysmgmt" ? "bg-[#60a5fa]" : "bg-[#feba48]"
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Card Header */}
            <div className="mb-6">
              {/* Mobile-only Brand Header */}
              <div className="lg:hidden flex items-center justify-between mb-5 pb-4 border-b border-[#e6eeff]">
                <div className="h-10 px-3 py-1 bg-white border border-[#c8d8f0] rounded-xl shadow-xs inline-flex items-center">
                  <img
                    src="/images/logo_pspk_horizontal_trimmed.png"
                    alt="Logo PSPK"
                    className="h-6 w-auto object-contain"
                  />
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    isHris ? "bg-[#fef3c7] text-[#92400e]" : "bg-[#dbeafe] text-[#1e40af]"
                  }`}
                >
                  {isHris ? "HRIS Portal" : "System Management"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full transition-colors duration-300 ${isHris ? "bg-[#f2af3e]" : "bg-[#60a5fa]"}`}></span>
                <span className={`text-[11px] font-bold tracking-widest uppercase transition-colors duration-300 ${isHris ? "text-[#805600]" : "text-[#102e50]"}`}>
                  {isHris ? "Akses Masuk Pegawai HRIS" : "Akses Administrator Sistem"}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl text-[#102e50] mt-1 mb-1 font-serif font-semibold transition-all duration-300">
                Masuk ke {isHris ? "HRIS" : "System Management"}
              </h2>
              <p className="text-xs sm:text-sm text-[#43474e] transition-all duration-300">
                {isHris
                  ? "Masukkan kredensial akun PSPK Anda untuk mengelola data kepegawaian dan kehadiran."
                  : "Masukkan kredensial akun administrator untuk mengelola hak akses, aset, dan audit log."}
              </p>
            </div>

            {/* Inline Error Banner Frame */}
            {formState === "error" && (
              <div className="mb-5 p-3.5 rounded bg-[#ffdad6] text-[#93000a] flex items-start gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
                <svg className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-bold text-[#ba1a1a] leading-tight">Autentikasi Gagal</p>
                  <p className="text-xs sm:text-sm text-[#93000a] mt-0.5">
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
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm text-[#121c2a] font-medium flex items-center gap-1" htmlFor="email-field">
                    Alamat Email PSPK
                    <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <span className="text-[11px] text-[#74777f] font-mono">Domain resmi @pspk.or.id</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#43474e]">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
                    className="w-full h-10 sm:h-11 pl-10 sm:pl-11 pr-4 rounded bg-white text-[#121c2a] text-xs sm:text-sm placeholder:text-[#74777f] border border-[#adc8f2] focus:outline-none focus:ring-2 focus:ring-[#102e50] shadow-xs transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm text-[#121c2a] font-medium flex items-center gap-1" htmlFor="password-field">
                    Kata Sandi
                    <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <a
                    className="text-xs text-[#805600] hover:underline font-semibold"
                    href={forgotPasswordHref}
                  >
                    Lupa password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#43474e]">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
                    className="w-full h-10 sm:h-11 pl-10 sm:pl-11 pr-11 sm:pr-12 rounded bg-white text-[#121c2a] text-xs sm:text-sm placeholder:text-[#74777f] border border-[#adc8f2] focus:outline-none focus:ring-2 focus:ring-[#102e50] shadow-xs transition-all duration-200"
                  />
                  <button
                    id="toggle-password-btn"
                    type="button"
                    aria-label="Tampilkan atau sembunyikan kata sandi"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#43474e] hover:text-[#121c2a] focus:outline-none transition-transform duration-150 active:scale-90"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Trust Device Checkbox */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    id="remember-me"
                    name="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded text-[#102e50] border-gray-300 focus:ring-[#feba48] cursor-pointer transition-transform duration-150 active:scale-95"
                    style={{ accentColor: "#102e50" }}
                  />
                  <span className="text-xs sm:text-sm text-[#121c2a]">Ingat saya di perangkat ini</span>
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
                  className="w-full h-11 mt-1 px-6 rounded bg-[#102e50]/85 text-white text-sm font-semibold tracking-wide flex items-center justify-center gap-3 cursor-wait shadow-xs"
                >
                  <svg className="animate-spin h-4 w-4 text-[#ffddb0]" fill="none" viewBox="0 0 24 24">
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
                  className="w-full h-11 mt-1 px-6 rounded bg-[#102e50] hover:bg-[#001934] active:scale-[0.99] text-white text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#102e50] cursor-pointer"
                >
                  <span>Masuk ke {isHris ? "HRIS" : "System Management"}</span>
                  <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Small Institutional Footer */}
        <footer className="w-full pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-[#43474e] border-t border-[#dee9fc] text-xs">
          <div className="text-center sm:text-left text-[#5b6675]">
            © PSPK • Pusat Studi Pendidikan dan Kebijakan
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a className="hover:text-[#001934] transition-colors duration-150" href="#keamanan">
              Kebijakan Privasi
            </a>
            <span className="text-[#c4c6cf]">•</span>
            <a className="hover:text-[#001934] transition-colors duration-150" href="#syarat">
              Protokol Keamanan
            </a>
            <span className="text-[#c4c6cf]">•</span>
            <a className="hover:text-[#001934] transition-colors duration-150" href="#kontak-it">
              Bantuan IT
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
