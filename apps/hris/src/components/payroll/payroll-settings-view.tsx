"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  FileText,
  Landmark,
  Save,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  PayrollSettingsData,
} from "@/server/queries/payroll-settings.queries";
import {
  updatePayrollSettingsAction,
  uploadPayrollBrandingAction,
  deletePayrollBrandingAction,
  PayrollSettingsInput,
} from "@/server/actions/payroll-settings.actions";
import { PayrollDocumentPreview } from "./payroll-document-preview";

interface PayrollSettingsViewProps {
  initialSettings: PayrollSettingsData;
}

const COMMON_BANKS = [
  "Bank Central Asia (BCA)",
  "Bank Mandiri",
  "Bank Rakyat Indonesia (BRI)",
  "Bank Negara Indonesia (BNI)",
  "Bank Syariah Indonesia (BSI)",
  "CIMB Niaga",
  "Bank Permata",
  "Bank Danamon",
  "Bank Lainnya",
];

const BORDER_PRESETS = [
  {
    key: "NAVY_SOLID",
    name: "Navy Solid (Default)",
    description: "Garis solid tunggal tebal biru Navy PSPK yang formal dan tegas.",
    previewClass: "border-b-2 border-[#102E50]",
  },
  {
    key: "NAVY_GOLD",
    name: "Navy & Gold Accent",
    description: "Kombinasi garis navy dengan aksen emas khas brand PSPK.",
    previewClass: "border-b-2 border-[#102E50] relative after:absolute after:bottom-[-3px] after:left-0 after:right-0 after:h-[2px] after:bg-[#F2AF3E]",
  },
  {
    key: "DOUBLE_LINE",
    name: "Double Line Klasik",
    description: "Dua garis paralel resmi standar surat dinas institusi formal.",
    previewClass: "border-b-4 border-double border-[#102E50]",
  },
  {
    key: "MINIMALIST",
    name: "Clean Minimalist",
    description: "Garis tipis halus netral dengan estetika modern.",
    previewClass: "border-b border-slate-200",
  },
];

export function PayrollSettingsView({ initialSettings }: PayrollSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"bank" | "document">("bank");
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form State
  const [institutionName, setInstitutionName] = useState(initialSettings.institutionName);
  const [subHeader, setSubHeader] = useState(initialSettings.subHeader);
  const [addressLine, setAddressLine] = useState(initialSettings.addressLine || "");
  const [borderStyle, setBorderStyle] = useState(initialSettings.borderStyle);
  const [disclaimerText, setDisclaimerText] = useState(initialSettings.disclaimerText);

  // Branding State
  const [logoKey, setLogoKey] = useState<string | null>(initialSettings.logoKey);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialSettings.logoUrl);
  const [headerBannerKey, setHeaderBannerKey] = useState<string | null>(initialSettings.headerBannerKey);
  const [headerBannerUrl, setHeaderBannerUrl] = useState<string | null>(initialSettings.headerBannerUrl);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Bank Info State
  const [senderBankName, setSenderBankName] = useState(initialSettings.senderBankName);
  const [customBankName, setCustomBankName] = useState(
    COMMON_BANKS.includes(initialSettings.senderBankName) ? "" : initialSettings.senderBankName,
  );
  const [senderBankAccount, setSenderBankAccount] = useState(
    initialSettings.senderAccountRaw || initialSettings.senderAccountMasked,
  );
  const [showRawAccount, setShowRawAccount] = useState(Boolean(initialSettings.senderAccountRaw));
  const [senderAccountName, setSenderAccountName] = useState(initialSettings.senderAccountName);
  const [senderBranch, setSenderBranch] = useState(initialSettings.senderBranch || "");
  const [payrollTransferNote, setPayrollTransferNote] = useState(initialSettings.payrollTransferNote);

  // Signatory State
  const [authorizedSignerName, setAuthorizedSignerName] = useState(
    initialSettings.authorizedSignerName || "",
  );
  const [authorizedSignerTitle, setAuthorizedSignerTitle] = useState(
    initialSettings.authorizedSignerTitle || "",
  );

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("target", "logo");

    const res = await uploadPayrollBrandingAction(formData);
    setIsUploadingLogo(false);

    if (res.ok && res.key && res.url) {
      setLogoKey(res.key);
      setLogoUrl(res.url);
      setStatusMessage({
        type: "success",
        text: "Logo lembaga berhasil diunggah. Klik 'Simpan Pengaturan' untuk menerapkan permanen.",
      });
    } else {
      setStatusMessage({
        type: "error",
        text: res.error || "Gagal mengunggah logo.",
      });
    }
  };

  // Handle Delete Logo
  const handleDeleteLogo = async () => {
    if (!confirm("Hapus logo kustom dan kembalikan ke lambang default PSPK?")) return;
    setLogoKey(null);
    setLogoUrl(null);
    await deletePayrollBrandingAction("logo");
    setStatusMessage({
      type: "success",
      text: "Logo kustom dihapus. Menggunakan lambang default.",
    });
  };

  // Handle Banner Upload
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("target", "banner");

    const res = await uploadPayrollBrandingAction(formData);
    setIsUploadingBanner(false);

    if (res.ok && res.key && res.url) {
      setHeaderBannerKey(res.key);
      setHeaderBannerUrl(res.url);
      setStatusMessage({
        type: "success",
        text: "Banner kop surat berhasil diunggah. Klik 'Simpan Pengaturan' untuk menerapkan.",
      });
    } else {
      setStatusMessage({
        type: "error",
        text: res.error || "Gagal mengunggah banner.",
      });
    }
  };

  // Handle Delete Banner
  const handleDeleteBanner = async () => {
    setHeaderBannerKey(null);
    setHeaderBannerUrl(null);
    await deletePayrollBrandingAction("banner");
    setStatusMessage({
      type: "success",
      text: "Banner kop surat dihapus. Beralih ke format kop surat teks & logo.",
    });
  };

  // Handle Save
  const handleSave = () => {
    setStatusMessage(null);

    const finalBankName =
      senderBankName === "Bank Lainnya" && customBankName.trim()
        ? customBankName.trim()
        : senderBankName;

    const payload: PayrollSettingsInput = {
      institutionName: institutionName.trim(),
      subHeader: subHeader.trim(),
      addressLine: addressLine.trim() || null,
      logoKey,
      headerBannerKey,
      borderStyle: borderStyle as "NAVY_SOLID" | "NAVY_GOLD" | "DOUBLE_LINE" | "MINIMALIST",
      disclaimerText: disclaimerText.trim(),
      senderBankName: finalBankName,
      senderBankAccount: senderBankAccount.trim(),
      senderAccountName: senderAccountName.trim(),
      senderBranch: senderBranch.trim() || null,
      payrollTransferNote: payrollTransferNote.trim(),
      authorizedSignerName: authorizedSignerName.trim() || null,
      authorizedSignerTitle: authorizedSignerTitle.trim() || null,
    };

    startTransition(async () => {
      const res = await updatePayrollSettingsAction(payload);
      if (res.ok) {
        setStatusMessage({
          type: "success",
          text: res.message || "Pengaturan berhasil disimpan!",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Gagal menyimpan pengaturan.",
        });
      }
    });
  };

  // Current preview values
  const previewSettings: PayrollSettingsInput & {
    logoUrl?: string | null;
    headerBannerUrl?: string | null;
    senderAccountMasked?: string;
  } = {
    institutionName,
    subHeader,
    addressLine,
    logoKey,
    logoUrl,
    headerBannerKey,
    headerBannerUrl,
    borderStyle: borderStyle as "NAVY_SOLID" | "NAVY_GOLD" | "DOUBLE_LINE" | "MINIMALIST",
    disclaimerText,
    senderBankName:
      senderBankName === "Bank Lainnya" && customBankName ? customBankName : senderBankName,
    senderBankAccount,
    senderAccountMasked: senderBankAccount.length > 4 ? `•••• ${senderBankAccount.slice(-4)}` : senderBankAccount,
    senderAccountName,
    senderBranch,
    payrollTransferNote,
    authorizedSignerName,
    authorizedSignerTitle,
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-16 animate-in fade-in duration-200">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link
              href="/payroll"
              className="hover:text-[#102E50] inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Penggajian (Payroll)</span>
            </Link>
            <span>/</span>
            <span className="text-[#102E50] font-bold">Pengaturan Dokumen & Bank</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
            Pengaturan Penggajian & Dokumen Resmi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi rekening bank operasional penyalur gaji PSPK, identitas kop surat, logo, dan gaya dokumen cetak slip gaji.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#102E50] text-white hover:bg-[#0c233d] transition-all text-xs font-bold shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin text-[#F2AF3E]" />
          ) : (
            <Save className="w-4 h-4 text-[#F2AF3E]" />
          )}
          <span>{isPending ? "Menyimpan..." : "Simpan Pengaturan"}</span>
        </button>
      </div>

      {/* Alert Status Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in slide-in-from-top-2 duration-200 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold hover:underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Settings (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Tab Navigation Segmented Control */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 w-full sm:w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("bank")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "bank"
                  ? "bg-white text-[#102E50] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Landmark className="w-4 h-4 text-emerald-600" />
              <span>Rekening Bank Pengirim</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("document")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "document"
                  ? "bg-white text-[#102E50] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4 text-[#F2AF3E]" />
              <span>Kop & Desain Dokumen</span>
            </button>
          </div>

          {/* TAB 1: REKENING BANK PENGIRIM */}
          {activeTab === "bank" && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col gap-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                      Rekening Operasional Penyalur Gaji PSPK
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Rekening sumber dana transfer penggajian bulanan yang tampil pada slip gaji pegawai.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nama Bank */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Nama Bank Pengirim <span className="text-rose-500">*</span>
                </label>
                <select
                  value={COMMON_BANKS.includes(senderBankName) ? senderBankName : "Bank Lainnya"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSenderBankName(val);
                    if (val !== "Bank Lainnya") {
                      setCustomBankName("");
                    }
                  }}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#102E50]"
                >
                  {COMMON_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                {senderBankName === "Bank Lainnya" && (
                  <input
                    type="text"
                    placeholder="Masukkan nama bank (mis. Bank Mega, Bank Jago)"
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    className="w-full mt-2 text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#102E50]"
                  />
                )}
              </div>

              {/* Nomor Rekening */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Nomor Rekening Lembaga <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRawAccount(!showRawAccount)}
                    className="text-[11px] text-slate-500 hover:text-[#102E50] inline-flex items-center gap-1 cursor-pointer"
                  >
                    {showRawAccount ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Sembunyikan Digit</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Digit Asli</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type={showRawAccount ? "text" : "password"}
                  value={senderBankAccount}
                  onChange={(e) => setSenderBankAccount(e.target.value)}
                  placeholder="Contoh: 5270123456"
                  className="w-full text-xs font-mono font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#102E50]"
                />
                <p className="text-[11px] text-slate-400">
                  Data nomor rekening dienkripsi dengan standar AES-256-GCM pada database untuk keamanan finansial.
                </p>
              </div>

              {/* Nama Pemilik Rekening */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Atas Nama Pemilik Rekening (Lembaga) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={senderAccountName}
                  onChange={(e) => setSenderAccountName(e.target.value)}
                  placeholder="Contoh: Pusat Studi Pendidikan dan Kebijakan"
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#102E50]"
                />
              </div>

              {/* Kantor Cabang Bank */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Kantor Cabang Bank (Opsional)
                </label>
                <input
                  type="text"
                  value={senderBranch}
                  onChange={(e) => setSenderBranch(e.target.value)}
                  placeholder="Contoh: KCU Jakarta Rasuna Said"
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#102E50]"
                />
              </div>

              {/* Catatan / Berita Transfer Standar */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Catatan / Berita Transfer Standar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={payrollTransferNote}
                  onChange={(e) => setPayrollTransferNote(e.target.value)}
                  placeholder="Contoh: Payroll Gaji Pegawai PSPK"
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#102E50]"
                />
              </div>
            </div>
          )}

          {/* TAB 2: KOP & DESAIN DOKUMEN RESMI */}
          {activeTab === "document" && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col gap-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#F2AF3E]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                      Kop Surat & Format Border Dokumen
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Atur identitas resmi lembaga yang dicetak pada slip gaji fisik dan format ekspor PDF.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preset Border Kop Dokumen */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Pilihan Gaya Garis Border Kop Surat
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BORDER_PRESETS.map((preset) => {
                    const isSelected = borderStyle === preset.key;
                    return (
                      <div
                        key={preset.key}
                        onClick={() => setBorderStyle(preset.key)}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#102E50] bg-blue-50/40 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-slate-900">
                            {preset.name}
                          </span>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "border-[#102E50] bg-[#102E50]"
                                : "border-slate-300"
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                          {preset.description}
                        </p>
                        <div className="pt-2">
                          <div className={preset.previewClass} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upload Logo Lembaga */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">
                  Logo Lembaga (Tampil di Sebelah Kiri Kop)
                </label>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <div className="relative w-16 h-16 rounded-xl border border-slate-200 bg-white p-2 shadow-2xs shrink-0 flex items-center justify-center">
                      <Image
                        src={logoUrl}
                        alt="Logo Preview"
                        width={50}
                        height={50}
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#102E50] text-[#F2AF3E] font-bold font-serif text-2xl flex items-center justify-center shadow-xs shrink-0">
                      P
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isUploadingLogo ? "Mengunggah..." : "Unggah Logo Baru"}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo}
                          className="hidden"
                        />
                      </label>

                      {logoKey && (
                        <button
                          type="button"
                          onClick={handleDeleteLogo}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Gunakan Default</span>
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Format PNG, JPG, atau WEBP transparan disarankan. Maksimal 2 MB.
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload Banner Kop Penuh (Opsional) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Banner Kop Surat Penuh (Opsional)
                  </label>
                  {headerBannerKey && (
                    <button
                      type="button"
                      onClick={handleDeleteBanner}
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Hapus Banner
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Gunakan jika lembaga Anda memiliki gambar kop surat horizontal utuh dari desainer grafis.
                </p>

                {headerBannerUrl ? (
                  <div className="relative w-full h-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                    <Image
                      src={headerBannerUrl}
                      alt="Banner Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">
                      {isUploadingBanner ? "Mengunggah..." : "Pilih file banner kop surat"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Rasio memanjang (mis. 800x120px), maksimal 2 MB
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleBannerUpload}
                      disabled={isUploadingBanner}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Identitas Teks Lembaga */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Nama Lembaga / Yayasan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="Contoh: Pusat Studi Pendidikan & Kebijakan"
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#102E50]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Subjudul / Divisi Penerbit <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subHeader}
                    onChange={(e) => setSubHeader(e.target.value)}
                    placeholder="Contoh: HR & Finance Division • Sistem Penggajian Elektronik"
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#102E50]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Alamat Kantor Resmi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="Contoh: Gedung Edukasi Lt. 3, Jl. Kebijakan No. 45, Jakarta Selatan"
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#102E50]"
                  />
                </div>
              </div>

              {/* Pejabat Penandatangan Resmi */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Pejabat Penandatangan Dokumen (Authorized Signer)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 block">
                      Nama Penandatangan
                    </label>
                    <input
                      type="text"
                      value={authorizedSignerName}
                      onChange={(e) => setAuthorizedSignerName(e.target.value)}
                      placeholder="Contoh: Dewi Permata, S.Psi."
                      className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#102E50]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 block">
                      Jabatan Resmi
                    </label>
                    <input
                      type="text"
                      value={authorizedSignerTitle}
                      onChange={(e) => setAuthorizedSignerTitle(e.target.value)}
                      placeholder="Contoh: HR & Finance Lead"
                      className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#102E50]"
                    />
                  </div>
                </div>
              </div>

              {/* Teks Disclaimer Legalitas */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">
                  Teks Disclaimer / Catatan Kaki Legalitas <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={disclaimerText}
                  onChange={(e) => setDisclaimerText(e.target.value)}
                  placeholder="Teks pernyataan keabsahan dokumen elektronik..."
                  className="w-full text-xs font-medium px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#102E50]"
                />
              </div>
            </div>
          )}

          {/* Bottom Save Action Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#102E50] text-white hover:bg-[#0c233d] transition-all text-xs font-bold shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#F2AF3E]" />
              ) : (
                <Save className="w-4 h-4 text-[#F2AF3E]" />
              )}
              <span>{isPending ? "Menyimpan Perubahan..." : "Simpan Pengaturan"}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Live Preview (5 cols) */}
        <div className="lg:col-span-5">
          <PayrollDocumentPreview settings={previewSettings} />
        </div>
      </div>
    </div>
  );
}
