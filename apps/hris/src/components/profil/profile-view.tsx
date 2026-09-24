"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  User,
  KeyRound,
  Layers,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { ProfileInfoTab } from "./profile-info-tab";
import { ChangePasswordTab } from "./change-password-tab";
import { SessionHistoryTab } from "./session-history-tab";
import { uploadAvatarAction } from "@/server/actions/profile.actions";
import type { UserProfileData } from "@/server/queries/profile.queries";

interface ProfileViewProps {
  profile: UserProfileData;
}

type TabType = "identitas" | "keamanan" | "sesi";

export function ProfileView({ profile }: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("identitas");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profile.image || profile.employee?.avatarUrl || null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync hash from URL on mount & hash change (e.g. from dropdown click /profil#keamanan)
  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash.replace("#", "");
      if (hash === "keamanan") {
        setActiveTab("keamanan");
      } else if (hash === "sesi") {
        setActiveTab("sesi");
      } else if (hash === "identitas") {
        setActiveTab("identitas");
      }
    }

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  const handleAvatarClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value to allow selecting the same file again if needed
    e.target.value = "";

    setUploadFeedback(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await uploadAvatarAction(formData);
      if (res.success && res.avatarUrl) {
        setAvatarUrl(res.avatarUrl);
        setUploadFeedback({
          type: "success",
          message: res.message || "Foto profil berhasil diperbarui.",
        });
      } else {
        setUploadFeedback({
          type: "error",
          message: res.error || "Gagal mengunggah foto profil.",
        });
      }
    } catch {
      setUploadFeedback({
        type: "error",
        message: "Terjadi kesalahan saat memproses unggahan foto.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const displayName = profile.employee?.fullName || profile.name;
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "U";
  const department = profile.employee?.department;
  const position = profile.employee?.position;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. HEADER PROFILE BANNER */}
      <div className="bg-white rounded-3xl border border-[#dee9fc] shadow-sm overflow-hidden">
        {/* Banner Background */}
        <div className="h-36 md:h-44 bg-gradient-to-r from-[#f4f7fb] via-[#f8fafd] to-[#eef4fc] border-b border-[#dee9fc] relative overflow-hidden flex items-center justify-center px-6">
          {/* Subtle decorative dot pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#102e50_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.035] pointer-events-none" />

          {/* Watermark Logo (faded in background) */}
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none select-none hidden sm:block">
            <img
              src="/images/logo_pspk_horizontal_trimmed.png"
              alt=""
              className="h-36 w-auto object-contain filter grayscale"
            />
          </div>

          {/* Featured PSPK Logo */}
          <div className="flex flex-col items-center justify-center gap-1.5 sm:ml-28 md:ml-0 z-0">
            <img
              src="/images/logo_pspk_horizontal_trimmed.png"
              alt="Pusat Studi Pendidikan dan Kebijakan"
              className="h-10 sm:h-12 md:h-14 w-auto object-contain drop-shadow-xs"
            />
            <span className="text-[11px] font-semibold text-[#74777f] tracking-wider uppercase">
              Pusat Studi Pendidikan dan Kebijakan
            </span>
          </div>

          {/* Top Right Portal Badge */}
          <div className="absolute top-3.5 right-5 hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[#102e50] text-[11px] font-semibold border border-[#dee9fc] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#f2af3e]" />
            <span>Portal HRIS</span>
          </div>
        </div>

        {/* User Card Content */}
        <div className="px-6 md:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {/* Avatar Container with Upload trigger: ONLY this element has negative margin */}
              <div className="relative group shrink-0 -mt-14 md:-mt-16 z-10">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-[#102e50] border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-white text-3xl font-bold font-heading">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>

                {/* Upload Button Overlay */}
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                  title="Ganti foto profil"
                  className="absolute bottom-1 right-1 p-2 rounded-xl bg-[#102e50] hover:bg-[#1b4372] text-[#f2af3e] border-2 border-white shadow-md transition-all cursor-pointer disabled:opacity-70 group-hover:scale-105"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
              </div>

              {/* Title & Subtitle: Perfectly positioned on the white background */}
              <div className="space-y-1.5 pt-2 sm:pt-3">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-[#102e50] font-heading tracking-tight">
                    {displayName}
                  </h1>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs md:text-sm text-[#475467] flex-wrap">
                  <span className="font-medium text-[#121c2a]">
                    {profile.employee?.workEmail || profile.email}
                  </span>
                  {(department || position) && (
                    <>
                      <span className="text-[#98a2b3]">•</span>
                      <span className="font-semibold text-[#102e50]">
                        {position || "Pegawai"} {department ? `(${department})` : ""}
                      </span>
                    </>
                  )}
                </div>

                {/* Role badges & NIP */}
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                  {profile.roles.map((r) => (
                    <span
                      key={r.key}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#eff4ff] text-[#102e50] border border-[#dee9fc]"
                    >
                      {r.name}
                    </span>
                  ))}
                  {profile.employee?.employeeNo && (
                    <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-semibold">
                      NIP: {profile.employee.employeeNo}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Status / Verified */}
            <div className="flex items-center justify-center md:justify-end gap-2 pt-2 sm:pt-4">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Status Akun Terverifikasi
              </span>
            </div>
          </div>

          {/* Upload Feedback Toast/Banner */}
          {uploadFeedback && (
            <div
              className={`mt-4 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200 ${
                uploadFeedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {uploadFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{uploadFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadFeedback(null)}
                className="text-xs font-semibold underline cursor-pointer hover:opacity-80"
              >
                Tutup
              </button>
            </div>
          )}
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-6 md:px-8 border-t border-[#dee9fc] bg-[#f8fafd] flex items-center gap-2 overflow-x-auto">
          {/* Tab 1: Identitas */}
          <button
            type="button"
            onClick={() => handleTabChange("identitas")}
            className={`flex items-center gap-2.5 px-4 py-3.5 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === "identitas"
                ? "border-[#102e50] text-[#102e50] bg-white -mb-px"
                : "border-transparent text-[#74777f] hover:text-[#102e50] hover:bg-white/50"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Identitas & Kepegawaian</span>
          </button>

          {/* Tab 2: Keamanan */}
          <button
            type="button"
            onClick={() => handleTabChange("keamanan")}
            className={`flex items-center gap-2.5 px-4 py-3.5 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === "keamanan"
                ? "border-[#102e50] text-[#102e50] bg-white -mb-px"
                : "border-transparent text-[#74777f] hover:text-[#102e50] hover:bg-white/50"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Keamanan & Kata Sandi</span>
          </button>

          {/* Tab 3: Sesi */}
          <button
            type="button"
            onClick={() => handleTabChange("sesi")}
            className={`flex items-center gap-2.5 px-4 py-3.5 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === "sesi"
                ? "border-[#102e50] text-[#102e50] bg-white -mb-px"
                : "border-transparent text-[#74777f] hover:text-[#102e50] hover:bg-white/50"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Riwayat Sesi Aktif</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#dee9fc] text-[#102e50]">
              {profile.sessions.length}
            </span>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT VIEW */}
      <div>
        {activeTab === "identitas" && <ProfileInfoTab profile={profile} />}
        {activeTab === "keamanan" && <ChangePasswordTab />}
        {activeTab === "sesi" && <SessionHistoryTab sessions={profile.sessions} />}
      </div>
    </div>
  );
}
