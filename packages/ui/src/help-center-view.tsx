"use client";

import React, { useState, useMemo } from "react";
import {
  HelpCircle,
  Search,
  BookOpen,
  KeyRound,
  ShieldAlert,
  Clock,
  Calendar,
  ReceiptText,
  Laptop,
  FileText,
  ShieldCheck,
  Mail,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  PhoneCall,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";

export interface HelpCenterViewProps {
  currentApp: "hris" | "sysmgmt";
  loginUrl?: string;
  dashboardUrl?: string;
}

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string | React.ReactNode;
  tags: string[];
}

export function HelpCenterView({
  currentApp,
  loginUrl = "/login",
  dashboardUrl = "/dashboard",
}: HelpCenterViewProps) {
  const isHris = currentApp === "hris";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    if (isHris) {
      return [
        { id: "all", label: "Semua Topik" },
        { id: "auth", label: "Akun & Sandi", icon: KeyRound },
        { id: "attendance", label: "Presensi & Jam Kerja", icon: Clock },
        { id: "leave", label: "Cuti & Perizinan", icon: Calendar },
        { id: "payroll", label: "Slip Gaji & Payroll", icon: ReceiptText },
        { id: "helpdesk", label: "Helpdesk IT", icon: PhoneCall },
      ];
    }
    return [
      { id: "all", label: "Semua Topik" },
      { id: "auth", label: "Akun & Keamanan", icon: KeyRound },
      { id: "rbac", label: "Hak Akses & Role", icon: ShieldCheck },
      { id: "assets", label: "Inventaris Aset", icon: Laptop },
      { id: "documents", label: "Dokumen & SOP", icon: FileText },
      { id: "audit", label: "Audit Log", icon: ShieldAlert },
      { id: "helpdesk", label: "Helpdesk IT", icon: PhoneCall },
    ];
  }, [isHris]);

  const faqs: FaqItem[] = useMemo(() => {
    if (isHris) {
      return [
        {
          id: "hris-1",
          category: "auth",
          question: "Bagaimana cara masuk pertama kali ke Portal HRIS PSPK?",
          answer:
            "Akun resmi dan kredensial akses pegawai (alamat email instansi @pspk.id dan kata sandi awal) diterbitkan oleh Admin HR atau IT Administrator PSPK. Saat pertama kali berhasil masuk, Anda disarankan langsung mengganti kata sandi melalui menu Profil Saya & Keamanan.",
          tags: ["login", "masuk", "akun", "pertama kali", "sandi", "password"],
        },
        {
          id: "hris-2",
          category: "auth",
          question: "Bagaimana jika saya lupa kata sandi atau akun terkunci?",
          answer: (
            <div className="space-y-2">
              <p>
                Jika Anda lupa kata sandi atau akun terkunci karena salah memasukkan kata sandi berulang kali:
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>
                  Hubungi Helpdesk IT PSPK melalui email resmi:{" "}
                  <strong className="text-[#102e50]">it@pspk.id</strong> atau Divisi SDM di{" "}
                  <strong className="text-[#102e50]">sdm@pspk.id</strong>.
                </li>
                <li>
                  Sebutkan Nama Lengkap dan Nomor Induk Pegawai (NIP/Employee No) Anda untuk proses verifikasi identitas.
                </li>
                <li>
                  IT Administrator akan mengatur ulang kata sandi sementara yang aman. Kata sandi baru minimal memiliki panjang 6 karakter.
                </li>
              </ol>
            </div>
          ),
          tags: ["lupa", "password", "kata sandi", "terkunci", "reset", "helpdesk"],
        },
        {
          id: "hris-3",
          category: "attendance",
          question: "Kapan jadwal jam kerja normal dan bagaimana toleransi keterlambatan?",
          answer:
            "Jadwal kerja normal harian kantor PSPK adalah pukul 09.00 - 17.00 WIB (Senin sampai Jumat). Sistem memberikan batas toleransi keterlambatan selama 15 menit (maksimal presensi masuk pukul 09.15 WIB) untuk tetap dikategorikan tepat waktu. Presensi masuk setelah pukul 09.15 WIB akan tercatat sebagai terlambat pada rekapitulasi presensi bulanan.",
          tags: ["presensi", "jam kerja", "toleransi", "terlambat", "absen", "wib"],
        },
        {
          id: "hris-4",
          category: "attendance",
          question: "Apakah presensi dapat dilakukan dari luar kantor (WFH / Perjalanan Dinas)?",
          answer:
            "Bisa. Saat melakukan presensi harian, Anda dapat memilih tipe lokasi kehadiran: Work From Office (WFO), Work From Home (WFH), atau Dinas Luar / Riset Lapangan. Pastikan penugasan WFH atau dinas luar telah dikoordinasikan sebelumnya dengan atasan langsung Anda.",
          tags: ["wfh", "wfo", "dinas", "riset", "lokasi", "kehadiran"],
        },
        {
          id: "hris-5",
          category: "leave",
          question: "Bagaimana alur pengajuan dan persetujuan cuti tahunan?",
          answer:
            "Pengajuan cuti dilakukan melalui menu 'Cuti' > 'Ajukan Cuti' minimal 3 hari kerja sebelum tanggal pelaksanaan. Permohonan akan otomatis dikirimkan ke atasan langsung (Manajer Divisi) untuk ditinjau. Setelah manajer menyetujui, kuota cuti Anda akan otomatis terpotong dan jadwal cuti akan muncul pada Kalender Kerja tim.",
          tags: ["cuti", "pengajuan", "izin", "tahunan", "persetujuan", "manajer"],
        },
        {
          id: "hris-6",
          category: "leave",
          question: "Berapa kuota cuti tahunan dan bagaimana jika saldo tidak mencukupi?",
          answer:
            "Setiap karyawan tetap berhak atas 12 hari cuti tahunan per tahun kalender (Januari - Desember). Jika kuota cuti tahunan habis atau permohonan bersangkutan memerlukan izin khusus (misal cuti sakit, melahirkan, atau cuti tanpa gaji), silakan ajukan dengan menyertakan dokumen pendukung atau koordinasikan langsung dengan Divisi SDM.",
          tags: ["saldo", "kuota", "hari", "sakit", "izin", "sdm"],
        },
        {
          id: "hris-7",
          category: "payroll",
          question: "Kapan slip gaji bulanan diterbitkan dan bagaimana cara mencetaknya?",
          answer:
            "Slip gaji bulanan diterbitkan secara elektronik setelah periode penggajian disahkan oleh Divisi SDM & Keuangan pada akhir bulan berjalan. Anda dapat mengakses arsip slip gaji kapan saja melalui menu 'Slip Gaji Saya', melihat rincian tunjangan serta potongan, dan mengunduh format cetak resmi ber-QR Code untuk keperluan administrasi perbankan/pribadi.",
          tags: ["gaji", "slip gaji", "payroll", "unduh", "cetak", "tunjangan", "potongan"],
        },
        {
          id: "hris-8",
          category: "helpdesk",
          question: "Ke mana saya harus menghubungi jika menemukan kendala teknis pada sistem?",
          answer:
            "Untuk kendala teknis aplikasi, kesalahan sistem (bug), atau kendala akses akun, kirimkan tangkapan layar (screenshot) dan penjelasan singkat ke email Helpdesk IT PSPK di it@pspk.id. Tim IT akan merespon dalam waktu maksimal 2 jam pada hari dan jam kerja operasional.",
          tags: ["helpdesk", "kontak", "email", "it", "kendala", "error", "bantuan"],
        },
      ];
    }

    return [
      {
        id: "sys-1",
        category: "auth",
        question: "Siapa saja yang memiliki hak akses ke PSPK System Management?",
        answer:
          "Portal PSPK System Management adalah area khusus untuk operasional tata kelola TI dan administrasi sistem lembaga. Portal ini diperuntukkan bagi Administrator TI (admin_it), Administrator SDM (admin_hr), dan Super Administrator (super_admin). Pengguna staf biasa hanya memiliki akses ke portal HRIS.",
        tags: ["hak akses", "admin", "login", "sysmgmt", "portal", "keamanan"],
      },
      {
        id: "sys-2",
        category: "auth",
        question: "Bagaimana standar keamanan akun dan masa berlaku sesi login?",
        answer:
          "Sistem menerapkan protokol keamanan berbasis sesi database terenkripsi. Sesi login akan kedaluwarsa otomatis setelah periode inaktif. Kata sandi minimal adalah 6 karakter. Sangat disarankan untuk tidak membagikan kredensial akun kepada siapapun.",
        tags: ["keamanan", "sesi", "password", "kata sandi", "enkripsi"],
      },
      {
        id: "sys-3",
        category: "rbac",
        question: "Bagaimana cara kerja matriks peran (Role-Based Access Control / RBAC)?",
        answer:
          "Sistem menggunakan pola izin modular: <modul>.<resource>.<aksi>:<scope>. Cakupan wewenang (scope) terbagi menjadi 'own' (data pribadi), 'team' (data anggota tim di bawah supervisi), dan 'all' (seluruh lembaga). Penyesuaian hak akses pengguna dapat dilakukan melalui menu Tata Kelola Pengguna & Hak Akses.",
        tags: ["rbac", "role", "peran", "izin", "permission", "scope", "akses"],
      },
      {
        id: "sys-4",
        category: "assets",
        question: "Bagaimana mencatat serah terima aset baru ke pegawai (Checkout)?",
        answer:
          "Buka menu Inventaris Aset Lembaga > Pilih unit aset bersangkutan > Klik tombol 'Checkout / Serah Terima'. Pilih nama pegawai penerima dari direktori aktif, masukkan tanggal serah terima, serta catatan kondisi unit. Status aset akan otomatis berubah menjadi 'DIPINJAM' dan riwayat penugasan tersimpan permanen.",
        tags: ["aset", "inventaris", "checkout", "serah terima", "laptop", "pegawai"],
      },
      {
        id: "sys-5",
        category: "documents",
        question: "Bagaimana penomoran versi dan siklus hidup Dokumen & SOP Lembaga?",
        answer:
          "Setiap dokumen kebijakan, pedoman operasional, dan SOP yang diunggah ke repositori sistem diberikan nomor registrasi dan kode kategori unik. Ketika terjadi revisi dokumen, sistem akan membuat nomor versi baru secara berurutan (misal v1.0 -> v1.1 atau v2.0) tanpa menghapus rekaman versi terdahulu demi kepatuhan jejak audit.",
        tags: ["dokumen", "sop", "kebijakan", "versi", "arsip", "kategori"],
      },
      {
        id: "sys-6",
        category: "audit",
        question: "Apa saja aktivitas yang dicatat pada Buku Besar Audit Log?",
        answer:
          "Audit Log mencatat secara otomatis setiap tindakan mutasi data penting pada level sistem, antara lain: login/logout pengguna, penambahan/penghapusan role pengguna, penerbitan slip gaji, persetujuan cuti, perpindahan aset kantor, dan perubahan pengaturan global. Setiap entri memuat data timestamp presisi, user ID, alamat IP, dan ringkasan mutasi.",
        tags: ["audit", "log", "buku besar", "keamanan", "mutasi", "jejak", "ip"],
      },
      {
        id: "sys-7",
        category: "helpdesk",
        question: "Bagaimana jika server atau layanan database mengalami kendala?",
        answer:
          "Segera hubungi tim infrastruktur TI PSPK di it@pspk.id. Sistem dilengkapi pemantauan kontainer Docker dan cadangan data otomatis terjadwal (backup database harian).",
        tags: ["server", "database", "gangguan", "helpdesk", "infrastruktur", "backup"],
      },
    ];
  }, [isHris]);

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory =
        selectedCategory === "all" || faq.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchQuestion = faq.question.toLowerCase().includes(q);
      const matchTags = faq.tags.some((t) => t.toLowerCase().includes(q));
      const matchAnswer =
        typeof faq.answer === "string"
          ? faq.answer.toLowerCase().includes(q)
          : false;

      return matchQuestion || matchTags || matchAnswer;
    });
  }, [faqs, selectedCategory, searchQuery]);

  const toggleAccordion = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-[#f8fafd] flex flex-col font-sans text-slate-800">
      {/* Top Brand Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a
              href={loginUrl}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#102e50] bg-slate-100/80 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg transition-colors duration-150"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </a>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f2af3e]" />
              <span className="font-heading font-bold text-sm sm:text-base text-[#102e50] tracking-tight">
                Pusat Bantuan PSPK
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {isHris ? "Portal HRIS" : "System Management"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={dashboardUrl}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#102e50] hover:text-[#001934] transition-colors"
            >
              <span>Buka Dasbor</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={loginUrl}
              className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-[#102e50] hover:bg-[#001934] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Halaman Masuk
            </a>
          </div>
        </div>
      </header>

      {/* Hero Banner with Integrated Search */}
      <section className="bg-gradient-to-b from-white via-white to-[#f4f7fc] border-b border-slate-200/80 py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dee9fc]/70 text-[#102e50] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#f2af3e]" />
            <span>Layanan Bantuan & Panduan Penggunaan Sistem</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-heading font-bold text-[#102e50] tracking-tight">
            Bagaimana kami dapat membantu Anda hari ini?
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Temukan jawaban cepat seputar akun, tata cara presensi harian, permohonan cuti, slip
            gaji, serta tata kelola hak akses di lingkungan Pusat Studi Pendidikan dan Kebijakan.
          </p>

          {/* Interactive Search Bar */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari topik bantuan (misal: lupa kata sandi, toleransi presensi, kuota cuti)..."
                className="w-full pl-12 pr-4 py-3.5 text-sm sm:text-base bg-white border border-slate-300/80 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-[#102e50] focus:border-transparent text-slate-900 placeholder:text-slate-400 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded-md"
                >
                  Bersihkan
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full space-y-10">
        {/* Quick Help Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-sm text-[#102e50] mb-1">
              Kendala Kata Sandi & Masuk
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Sandi minimal 6 karakter. Jika lupa atau terkunci karena salah input berulang kali,
              hubungi Helpdesk IT untuk reset instan.
            </p>
            <a
              href="#lupa-password"
              onClick={() => {
                setSelectedCategory("auth");
                setExpandedId(isHris ? "hris-2" : "sys-2");
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#102e50] hover:text-[#001934]"
            >
              <span>Solusi Akun & Sandi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-sm text-[#102e50] mb-1">
              {isHris ? "Presensi & Jam Kantor" : "Pengelolaan Aset & Lisensi"}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              {isHris
                ? "Jam kerja normal 09.00 - 17.00 WIB dengan toleransi masuk tepat waktu 15 menit. Fleksibel untuk WFO, WFH, dan dinas luar."
                : "Tata kelola inventaris laptop lembaga, alokasi lisensi perangkat lunak, dan kepatuhan checkout fisik unit."}
            </p>
            <a
              href="#operasional"
              onClick={() => {
                setSelectedCategory(isHris ? "attendance" : "assets");
                setExpandedId(isHris ? "hris-3" : "sys-4");
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#102e50] hover:text-[#001934]"
            >
              <span>Pelajari Prosedur</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-sm text-[#102e50] mb-1">
              Helpdesk IT & Tim SDM
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Butuh bantuan teknis atau administrasi yang mendesak? Surel resmi Helpdesk TI siap
              membantu Anda setiap hari kerja.
            </p>
            <a
              href="#kontak"
              onClick={() => setSelectedCategory("helpdesk")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#102e50] hover:text-[#001934]"
            >
              <span>Hubungi Helpdesk</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-heading font-bold text-[#102e50]">
                Pertanyaan yang Sering Diajukan (FAQ)
              </h2>
              <p className="text-xs text-slate-500">
                Pilih kategori atau ketik kata kunci untuk menyaring topik yang Anda butuhkan.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
              Menampilkan {filteredFaqs.length} dari {faqs.length} topik
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#102e50] text-white shadow-xs"
                      : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-base text-slate-800">
                Topik bantuan tidak ditemukan
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tidak ada topik FAQ yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;. Silakan
                periksa ejaan atau hubungi langsung Helpdesk IT kami.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              >
                Reset Pencarian
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  id={faq.id === "hris-2" || faq.id === "sys-2" ? "lupa-password" : undefined}
                  className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? "border-[#102e50]/40 shadow-xs ring-1 ring-[#102e50]/10"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isOpen ? "bg-[#f2af3e]" : "bg-slate-300"
                        }`}
                      />
                      <span className="text-xs sm:text-sm font-semibold text-[#102e50] leading-snug">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#102e50]" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-150">
                      {typeof faq.answer === "string" ? <p>{faq.answer}</p> : faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Contact Helpdesk Box */}
        <section
          id="kontak"
          className="bg-gradient-to-r from-[#102e50] to-[#184474] text-white rounded-2xl p-6 sm:p-8 shadow-md"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 text-xs font-medium">
                <Info className="w-3.5 h-3.5" />
                <span>Saluran Resmi IT & SDM PSPK</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight">
                Masih membutuhkan panduan atau mengalami kendala?
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Tim IT Administrator dan Divisi Kepegawaian siap memberikan pendampingan langsung.
                Pastikan Anda menyertakan identitas pegawai dan tangkapan layar jika melaporkan kendala teknis.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              <a
                href="mailto:it@pspk.id?subject=Bantuan%20Sistem%20PSPK&body=Halo%20Tim%20IT%20PSPK,%0A%0ANama%20Lengkap:%20%0ANIP/Email:%20%0AKendala%20yang%20dialami:%20%0A"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#f2af3e] hover:bg-[#e09e2e] text-[#102e50] text-xs font-bold shadow-xs transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Hubungi IT: it@pspk.id</span>
              </a>
              <a
                href="mailto:sdm@pspk.id?subject=Pertanyaan%20Kepegawaian%20PSPK"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Divisi SDM: sdm@pspk.id</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Institutional Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © {new Date().getFullYear()} Pusat Studi Pendidikan dan Kebijakan (PSPK). Seluruh hak cipta dilindungi.
          </div>
          <div className="flex items-center gap-4">
            <a href={loginUrl} className="hover:text-[#102e50] transition-colors">
              Masuk Akun
            </a>
            <span>•</span>
            <a href={dashboardUrl} className="hover:text-[#102e50] transition-colors">
              Dasbor Utama
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
