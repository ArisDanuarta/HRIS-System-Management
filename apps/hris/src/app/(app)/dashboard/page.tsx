"use client";

import React, { useState } from "react";
import {
  Users,
  CalendarCheck,
  Search,
  Upload,
  UserPlus,
  FileText,
  TrendingUp,
  Clock,
  Check,
  X,
  FileSpreadsheet,
  History,
  Briefcase,
  Calendar,
  CheckCircle2,
  Layers,
} from "lucide-react";

export default function DashboardPage() {
  // Perspective view tab: "admin_hr" | "manager" | "staff"
  const [viewMode, setViewMode] = useState<"admin_hr" | "manager" | "staff">("admin_hr");

  // Interactive mock states for manager approvals
  const [approvedRequests, setApprovedRequests] = useState<string[]>([]);
  const [rejectedRequests, setRejectedRequests] = useState<string[]>([]);

  // Search and filter states for admin HR
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterPill, setActiveFilterPill] = useState("semua");

  const handleApprove = (id: string) => {
    setApprovedRequests((prev) => [...prev, id]);
  };

  const handleReject = (id: string) => {
    setRejectedRequests((prev) => [...prev, id]);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Mode Perspective Selector (Allows previewing all 3 Stitch screens: P-1A, P-1C, P-1B) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#dee9fc] shadow-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#f2af3e]" />
          <span className="text-xs font-bold text-[#102e50] uppercase tracking-wider">
            Mode Tampilan Dashboard:
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#eff4ff] p-1 rounded-lg border border-[#dee9fc] w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode("admin_hr")}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "admin_hr"
                ? "bg-[#102e50] text-white shadow-xs"
                : "text-[#43474e] hover:text-[#102e50]"
            }`}
          >
            Admin HR (P-1A)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("manager")}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "manager"
                ? "bg-[#102e50] text-white shadow-xs"
                : "text-[#43474e] hover:text-[#102e50]"
            }`}
          >
            Manajer Tim (P-1C)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("staff")}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "staff"
                ? "bg-[#102e50] text-white shadow-xs"
                : "text-[#43474e] hover:text-[#102e50]"
            }`}
          >
            Karyawan / Staff (P-1B)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ADMIN HR VIEW (SCREEN P-1A: MANAJEMEN KARYAWAN & DIREKTORI STAF)       */}
      {/* ========================================================================= */}
      {viewMode === "admin_hr" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          {/* Header & Quick Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#74777f] mb-1">
                <span>Direktori Staf</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#f2af3e]"></span>
                <span>Tahun Ajaran / Semester Ganjil 2026</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl text-[#102e50] font-serif font-bold tracking-tight">
                Manajemen Karyawan
              </h1>
              <p className="text-xs sm:text-sm text-[#5b6675] mt-1 max-w-2xl">
                Kelola data induk 148 pegawai, peneliti kebijakan pendidikan, dan staf operasional PSPK.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#dee9fc] text-[#102e50] hover:bg-[#eff4ff] text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#102e50]" />
                <span>Impor Data Excel</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#102e50] text-white hover:bg-[#0c233d] text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-[#ffddb0]" />
                <span>+ Tambah Karyawan Baru</span>
              </button>
            </div>
          </div>

          {/* 3 Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Card 1: Total Karyawan Aktif */}
            <div className="relative overflow-hidden bg-white p-5 rounded-xl border border-[#dee9fc] shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-[#5b6675]">Total Karyawan Aktif</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl sm:text-4xl font-bold text-[#102e50] leading-none">148</span>
                    <span className="text-sm font-medium text-[#5b6675]">Orang</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#eff4ff] text-[#102e50] flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#102e50]" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#dee9fc] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#805600] font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+3% dibanding kuartal lalu</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#eff4ff] text-[#102e50] font-bold text-[10px]">
                  PSPK Inti
                </span>
              </div>
            </div>

            {/* Card 2: Cuti Menunggu Persetujuan */}
            <div className="relative overflow-hidden bg-white p-5 rounded-xl border border-[#dee9fc] shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-[#5b6675]">Cuti Menunggu Persetujuan</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl sm:text-4xl font-bold text-[#805600] leading-none">5</span>
                    <span className="text-sm font-medium text-[#5b6675]">Pengajuan</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#ffddb0] text-[#805600] flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5 text-[#805600]" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#dee9fc] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#5b6675]">
                  <span className="w-2 h-2 rounded-full bg-[#f2af3e] animate-pulse"></span>
                  <span>Perlu ditinjau HR Lead</span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode("manager")}
                  className="font-bold text-[#805600] hover:underline cursor-pointer"
                >
                  Tinjau Sekarang →
                </button>
              </div>
            </div>

            {/* Card 3: Peneliti Lapangan */}
            <div className="relative overflow-hidden bg-white p-5 rounded-xl border border-[#dee9fc] shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-[#5b6675]">Peneliti & Tim Lapangan</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl sm:text-4xl font-bold text-[#102e50] leading-none">32</span>
                    <span className="text-sm font-medium text-[#5b6675]">Orang</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#eff4ff] text-[#102e50] flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-[#102e50]" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#dee9fc] flex items-center justify-between text-xs">
                <span className="text-[#102e50] font-medium">7 Wilayah Proyek • Sumba, NTT, Jabar</span>
                <span className="px-2 py-0.5 rounded bg-[#dee9fc] text-[#102e50] font-bold text-[10px]">
                  Aktif Lapangan
                </span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-xl p-4 border border-[#dee9fc] shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama pegawai, NIP, atau keahlian riset..."
                  className="w-full h-10 pl-10 pr-4 text-xs sm:text-sm bg-[#eff4ff] rounded-lg border border-transparent focus:border-[#102e50] focus:bg-white focus:outline-none transition-all placeholder:text-[#74777f]"
                />
              </div>

              {/* Quick Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-[#74777f] mr-1 hidden sm:inline">Filter:</span>
                {[
                  { id: "semua", label: "Semua", count: 148 },
                  { id: "tetap", label: "Tetap", count: 94 },
                  { id: "kontrak", label: "Kontrak Riset", count: 42 },
                  { id: "magang", label: "Magang", count: 12 },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setActiveFilterPill(pill.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeFilterPill === pill.id
                        ? "bg-[#102e50] text-white"
                        : "bg-[#eff4ff] text-[#43474e] hover:bg-[#dee9fc]"
                    }`}
                  >
                    {pill.label} ({pill.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Action Center Panel */}
          <div className="bg-white rounded-xl p-8 sm:p-12 border border-[#dee9fc] shadow-xs flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#eff4ff] border border-[#dee9fc] text-[#102e50] flex items-center justify-center mb-4 shadow-xs">
              <Users className="w-7 h-7 text-[#102e50]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#102e50]">
              Direktori Staf Siap Ditampilkan
            </h2>
            <p className="text-xs sm:text-sm text-[#5b6675] max-w-md mt-1 mb-6">
              Gunakan bilah pencarian di atas untuk menelusuri data 148 pegawai PSPK, atau gunakan perintah cepat di bawah ini.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#eff4ff] hover:bg-[#dee9fc] text-[#102e50] text-xs font-semibold transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#102e50]" />
                <span>Unduh Template Data Pegawai (.xlsx)</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#eff4ff] hover:bg-[#dee9fc] text-[#102e50] text-xs font-semibold transition-colors cursor-pointer"
              >
                <History className="w-4 h-4 text-[#102e50]" />
                <span>Lihat Riwayat Audit Log Pegawai</span>
              </button>
            </div>
          </div>

          {/* Institutional SOP Banner */}
          <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#dee9fc] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white shadow-xs flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-[#102e50]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#102e50]">
                  Panduan Pengarsipan Dokumen Karyawan PSPK
                </p>
                <p className="text-[11px] text-[#5b6675]">
                  Pastikan SK Pengangkatan, KTP, dan MoU Peneliti telah terunggah ke Cloud Storage terenkripsi PSPK.
                </p>
              </div>
            </div>
            <a
              href="#sop-kepegawaian"
              className="text-xs font-bold text-[#805600] hover:underline shrink-0"
            >
              Pelajari SOP →
            </a>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MANAGER VIEW (SCREEN P-1C: PERSETUJUAN CUTI TIM RISET)                 */}
      {/* ========================================================================= */}
      {viewMode === "manager" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          {/* Header & Manager Actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#805600] mb-1">
                <span>Persetujuan Tertunda</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#f2af3e]"></span>
                <span>Periode Q3 2026</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl text-[#102e50] font-serif font-bold tracking-tight">
                Persetujuan Cuti Tim Riset
              </h1>
              <p className="text-xs sm:text-sm text-[#5b6675] mt-1 max-w-2xl">
                Ada 3 pengajuan cuti tertunda dari anggota tim riset yang membutuhkan tinjauan dan konfirmasi manajerial Anda.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-white border border-[#dee9fc] text-[#102e50] hover:bg-[#eff4ff] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Filter Anggota Tim
              </button>
              <button
                type="button"
                onClick={() => setApprovedRequests(["req-1", "req-2", "req-3"])}
                className="px-4 py-2 rounded-lg bg-[#f2af3e] hover:bg-[#e09d2c] text-[#102e50] text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer"
              >
                Setujui Semua yang Memenuhi Syarat
              </button>
            </div>
          </div>

          {/* 4 Team Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#dee9fc] shadow-xs">
              <span className="text-xs text-[#5b6675] font-medium">Tertunda Ditinjau</span>
              <div className="text-2xl font-bold text-[#ba1a1a] mt-1">
                {3 - approvedRequests.length - rejectedRequests.length} Permohonan
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#dee9fc] shadow-xs">
              <span className="text-xs text-[#5b6675] font-medium">Kapasitas Tim Aktif</span>
              <div className="text-2xl font-bold text-[#102e50] mt-1">87.5% (14/16)</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#dee9fc] shadow-xs">
              <span className="text-xs text-[#5b6675] font-medium">Disetujui Bulan Ini</span>
              <div className="text-2xl font-bold text-[#102e50] mt-1">12 Pengajuan</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#dee9fc] shadow-xs">
              <span className="text-xs text-[#5b6675] font-medium">Rata-rata Respon</span>
              <div className="text-2xl font-bold text-[#102e50] mt-1">4.2 Jam Kerja</div>
            </div>
          </div>

          {/* List of Leave Requests Cards */}
          <div className="flex flex-col gap-4">
            {/* Request 1 */}
            <LeaveRequestCard
              id="req-1"
              name="Siti Rahma"
              role="Analis Kebijakan Madya • Kebijakan Guru"
              leaveType="Cuti Tahunan • 3 Hari"
              dates="14 Mei 2026 – 16 Mei 2026"
              submittedAt="Diajukan 2 jam lalu"
              balanceInfo="Sisa Kuota Cuti: 9 Hari"
              reason="Keperluan urusan keluarga dan pendampingan akreditasi madrasah di Surakarta. Seluruh draft bab 3 telah diserahterimakan ke Ahmad Fauzan."
              isApproved={approvedRequests.includes("req-1")}
              isRejected={rejectedRequests.includes("req-1")}
              onApprove={() => handleApprove("req-1")}
              onReject={() => handleReject("req-1")}
            />

            {/* Request 2 */}
            <LeaveRequestCard
              id="req-2"
              name="Budi Santoso"
              role="Peneliti Muda Kurikulum • Litbang Vokasi"
              leaveType="Izin Sakit • 1 Hari"
              dates="Hari Ini, 12 Mei 2026"
              submittedAt="Diajukan 4 jam lalu"
              attachment="Surat Keterangan Dokter Terlampir (Valid [Klinik Pratama])"
              reason="Istirahat medis pasca perawatan demam di RS PGI Cikini. Agenda rapat koordinasi Balitbangda diwakilkan oleh Rian Hidayat."
              isApproved={approvedRequests.includes("req-2")}
              isRejected={rejectedRequests.includes("req-2")}
              onApprove={() => handleApprove("req-2")}
              onReject={() => handleReject("req-2")}
            />

            {/* Request 3 */}
            <LeaveRequestCard
              id="req-3"
              name="Nadia Utami"
              role="Spesialis Riset Evaluasi • Monitoring Kebijakan"
              leaveType="Cuti Melahirkan • 90 Hari Kalender"
              dates="1 Juni 2026 – 29 Agustus 2026"
              submittedAt="Diajukan kemarin"
              attachment="Rencana Handover Lengkap (Hak Cuti Regulasi: 3 Bulan Penuh)"
              reason="Hak cuti bersalin resmi sesuai regulasi kepegawaian. Rencana serah kelola instrumen survei nasional telah disetujui koordinator program."
              isApproved={approvedRequests.includes("req-3")}
              isRejected={rejectedRequests.includes("req-3")}
              onApprove={() => handleApprove("req-3")}
              onReject={() => handleReject("req-3")}
            />
          </div>

          <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#dee9fc] flex items-center justify-between text-xs text-[#5b6675]">
            <span>
              Setiap persetujuan diteruskan secara otomatis ke unit HR &amp; penggajian PSPK sesuai SOP Kepegawaian Bab 4.
            </span>
            <a href="#regulasi-cuti" className="font-semibold text-[#102e50] hover:underline">
              Lihat Regulasi Cuti Lembaga ↗
            </a>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. STAFF VIEW (SCREEN P-1B: PROFIL SAYA & LAYANAN MANDIRI KARYAWAN)       */}
      {/* ========================================================================= */}
      {viewMode === "staff" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#74777f] mb-1">
                <span>Portal Kepegawaian Peneliti</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#f2af3e]"></span>
                <span>Aktif 2026</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl text-[#102e50] font-serif font-bold tracking-tight">
                Profil Saya &amp; Portofolio Riset
              </h1>
              <p className="text-xs sm:text-sm text-[#5b6675] mt-1 max-w-2xl">
                Informasi data kepegawaian resmi, rekap kehadiran, dan saldo cuti aktif Anda di PSPK.
              </p>
            </div>

            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-[#f2af3e] hover:bg-[#e09d2c] text-[#102e50] text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer self-start md:self-auto"
            >
              Ajukan Perubahan Data
            </button>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
            {/* Card 1: Identity Card */}
            <div className="bg-white p-5 rounded-xl border border-[#dee9fc] shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#102e50] text-white font-bold flex items-center justify-center text-base shadow-xs shrink-0">
                  MW
                </div>
                <div>
                  <span className="text-[10px] font-mono font-semibold bg-[#eff4ff] text-[#102e50] px-1.5 py-0.5 rounded">
                    NIP: 2022-09-041
                  </span>
                  <h2 className="text-base font-bold text-[#102e50] leading-tight mt-1">Made Wirawan</h2>
                  <p className="text-xs text-[#5b6675]">Divisi Kebijakan Kurikulum</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#dee9fc] text-[11px] flex flex-col gap-1 text-[#5b6675]">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-semibold text-[#102e50]">Karyawan Tetap</span>
                </div>
                <div className="flex justify-between">
                  <span>Lokasi:</span>
                  <span className="font-semibold text-[#102e50]">Pusat Studi Jakarta</span>
                </div>
              </div>
            </div>

            {/* Card 2: Saldo Cuti */}
            <div className="bg-white p-5 rounded-xl border border-[#dee9fc] shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-medium text-[#5b6675]">Saldo Cuti Tersisa</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-bold text-[#102e50] leading-none">8</span>
                  <span className="text-sm text-[#5b6675]">Hari</span>
                </div>
                <p className="text-[11px] text-[#74777f] mt-1">Dari kuota tahunan 12 hari (s.d Des 2026)</p>
              </div>
              <div className="w-full bg-[#eff4ff] h-2 rounded-full overflow-hidden mt-4">
                <div className="bg-[#f2af3e] h-full rounded-full" style={{ width: "66%" }}></div>
              </div>
            </div>

            {/* Card 3: Kehadiran Bulan Ini */}
            <div className="bg-white p-5 rounded-xl border border-[#dee9fc] shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-medium text-[#5b6675]">Kehadiran Bulan Ini</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-bold text-[#102e50] leading-none">98.5%</span>
                </div>
                <p className="text-[11px] text-[#805600] font-semibold flex items-center gap-1 mt-1">
                  <Check className="w-3 h-3 text-[#805600]" />
                  <span>Tepat Waktu (Hadir: 20 hari, Terlambat: 0)</span>
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#dee9fc] flex justify-between text-xs text-[#5b6675]">
                <span>Status Absensi</span>
                <span className="font-bold text-[#102e50]">Sangat Baik</span>
              </div>
            </div>

            {/* Card 4: Status Jabatan Riset */}
            <div className="bg-white p-5 rounded-xl border border-[#dee9fc] shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-medium text-[#5b6675]">Status Jabatan Riset</span>
                <h3 className="text-base font-bold text-[#102e50] mt-2 leading-tight">
                  Peneliti Muda Kebijakan Kurikulum
                </h3>
                <span className="inline-block mt-1 bg-[#eff4ff] text-[#102e50] font-bold text-[10px] px-2 py-0.5 rounded">
                  AKTIF
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-[#dee9fc] text-[11px] text-[#5b6675]">
                <span>Penyelia: </span>
                <span className="font-semibold text-[#102e50]">Dr. Anindito Aditomo</span>
              </div>
            </div>
          </div>

          {/* Details Grid (Induk Kepegawaian & Tugas Riset) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Data Induk */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-[#dee9fc] shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#dee9fc]">
                <h3 className="font-serif text-lg font-bold text-[#102e50]">
                  Data Induk Kepegawaian
                </h3>
                <span className="bg-[#eff4ff] text-[#102e50] text-[11px] font-bold px-2 py-0.5 rounded">
                  Terverifikasi HR
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
                <div>
                  <span className="text-[#74777f]">Nama Lengkap &amp; Gelar:</span>
                  <p className="font-bold text-[#102e50] mt-0.5">Made Wirawan, S.Pd., M.Ed.</p>
                </div>
                <div>
                  <span className="text-[#74777f]">Email Institusi:</span>
                  <p className="font-bold text-[#102e50] mt-0.5">m.wirawan@pspk.or.id</p>
                </div>
                <div>
                  <span className="text-[#74777f]">Pendidikan Terakhir:</span>
                  <p className="font-bold text-[#102e50] mt-0.5">Master of Education, Univ. of Melbourne</p>
                </div>
                <div>
                  <span className="text-[#74777f]">Pusat Kajian Utama:</span>
                  <p className="font-bold text-[#102e50] mt-0.5">Kurikulum Transformatif &amp; Asesmen</p>
                </div>
              </div>

              {/* Log Absensi Terakhir */}
              <div className="mt-6 pt-4 border-t border-[#dee9fc]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-serif text-sm font-bold text-[#102e50]">
                    Aktivitas &amp; Log Absensi Terakhir
                  </h4>
                  <a href="/absensi" className="text-xs text-[#805600] font-semibold hover:underline">
                    Lihat Rekap Presensi →
                  </a>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#eff4ff] text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#102e50]" />
                      <span>Presensi Masuk Hari Ini (Kantor Thamrin, Jakarta)</span>
                    </div>
                    <span className="font-bold text-[#102e50]">08:24 WIB • Tepat Waktu</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Tugas & Proyek Riset Aktif */}
            <div className="bg-white rounded-xl p-6 border border-[#dee9fc] shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#102e50] pb-2 border-b border-[#dee9fc]">
                  Tugas &amp; Proyek Riset Aktif
                </h3>
                <p className="text-xs text-[#5b6675] mt-3">
                  Daftar penugasan riset kolaboratif, policy brief, dan kajian berkala PSPK.
                </p>

                <div className="mt-6 p-4 rounded-xl bg-[#eff4ff] border border-[#dee9fc] text-center">
                  <CheckCircle2 className="w-8 h-8 text-[#102e50] mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#102e50]">
                    Semua Deliverable Laporan Minggu Ini Tuntas
                  </p>
                  <p className="text-[11px] text-[#5b6675] mt-1">
                    Menunggu peninjauan dari Kepala Divisi Riset Kebijakan.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#dee9fc]">
                <button
                  type="button"
                  className="w-full py-2 rounded-lg bg-[#102e50] hover:bg-[#0c233d] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Inisiatif Kajian Mandiri
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Leave Request Card in Manager View
interface LeaveRequestCardProps {
  id: string;
  name: string;
  role: string;
  leaveType: string;
  dates: string;
  submittedAt: string;
  balanceInfo?: string;
  attachment?: string;
  reason: string;
  isApproved: boolean;
  isRejected: boolean;
  onApprove: () => void;
  onReject: () => void;
}

function LeaveRequestCard({
  name,
  role,
  leaveType,
  dates,
  submittedAt,
  balanceInfo,
  attachment,
  reason,
  isApproved,
  isRejected,
  onApprove,
  onReject,
}: LeaveRequestCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 border border-[#dee9fc] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-[#f2af3e]">
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-[#102e50] text-sm">{name}</span>
          <span className="text-xs text-[#74777f]">•</span>
          <span className="text-xs text-[#5b6675] font-medium">{role}</span>
        </div>

        <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs">
          <span className="font-bold text-[#805600] bg-[#ffddb0]/60 px-2 py-0.5 rounded">
            {leaveType}
          </span>
          <span className="text-[#102e50] font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {dates}
          </span>
          <span className="text-[#74777f] text-[11px]">{submittedAt}</span>
          {balanceInfo && (
            <span className="text-[11px] font-semibold text-[#5b6675] bg-[#eff4ff] px-2 py-0.5 rounded">
              {balanceInfo}
            </span>
          )}
        </div>

        {attachment && (
          <div className="mt-2 text-xs text-[#805600] font-semibold flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>{attachment}</span>
          </div>
        )}

        <p className="text-xs text-[#43474e] mt-2.5 leading-relaxed bg-[#f8f9ff] p-3 rounded-lg border border-[#dee9fc]">
          <span className="font-semibold text-[#102e50]">Alasan: </span>
          {reason}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
        {isApproved ? (
          <div className="px-3 py-1.5 rounded-lg bg-[#eff4ff] text-[#102e50] font-bold text-xs flex items-center gap-1.5">
            <Check className="w-4 h-4 text-[#805600]" />
            <span>Telah Disetujui</span>
          </div>
        ) : isRejected ? (
          <div className="px-3 py-1.5 rounded-lg bg-[#ffdad6] text-[#ba1a1a] font-bold text-xs flex items-center gap-1.5">
            <X className="w-4 h-4 text-[#ba1a1a]" />
            <span>Ditolak</span>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onReject}
              className="px-4 py-2 rounded-lg bg-white border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6]/30 text-xs font-bold transition-colors cursor-pointer"
            >
              Tolak
            </button>
            <button
              type="button"
              onClick={onApprove}
              className="px-4 py-2 rounded-lg bg-[#102e50] text-white hover:bg-[#0c233d] text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              Setujui
            </button>
          </>
        )}
      </div>
    </div>
  );
}
