"use client";

import React, { useState, useMemo, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Mail,
  Send,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  X,
  Calendar,
  TrendingUp,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  FileText,
  Download,
  Paperclip,
  Clock,
  Ban,
} from "lucide-react";
import {
  BroadcastHistoryItem,
  BroadcastHistoryStats,
  BroadcastDetailItem,
} from "../../server/queries/broadcast.queries";
import {
  getBroadcastDetailAction,
  resendFailedBroadcastAction,
  cancelScheduledBroadcastAction,
} from "../../server/actions/broadcast.actions";
import { PspkLoader } from "@pspk/ui";

interface BroadcastHistoryViewProps {
  items?: BroadcastHistoryItem[];
  initialItems?: BroadcastHistoryItem[];
  total?: number;
  page?: number;
  totalPages?: number;
  stats: BroadcastHistoryStats;
  canCreate: boolean;
  initialSearch?: string;
  initialScope?: string;
  initialStatus?: string;
}

export function BroadcastHistoryView({
  items,
  initialItems,
  total,
  page,
  totalPages,
  stats,
  canCreate,
  initialSearch = "",
  initialScope = "ALL",
  initialStatus = "ALL",
}: BroadcastHistoryViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const displayItems = items ?? initialItems ?? [];
  const currentPage = page ?? 1;
  const maxPages = totalPages ?? 1;
  const totalCount = total ?? displayItems.length;

  const activeScope = searchParams.get("scope") || initialScope;
  const activeStatus = searchParams.get("status") || initialStatus;
  const urlQ = searchParams.get("q") || searchParams.get("search") || "";

  // Pola resmi React untuk menyesuaikan state saat searchParams URL berubah (tanpa useEffect)
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  const [searchQuery, setSearchQuery] = useState(initialSearch || urlQ);

  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ);
    setSearchQuery(urlQ);
  }

  // Polling aktif tiap 3 detik HANYA jika ada item QUEUED atau SENDING di halaman dan tab browser aktif
  const hasActiveQueueItems = displayItems.some(
    (item) => item.status === "QUEUED" || item.status === "SENDING",
  );

  useEffect(() => {
    if (!hasActiveQueueItems) return;

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        router.refresh();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [hasActiveQueueItems, router]);

  // Detail Modal State
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<BroadcastDetailItem | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [recipientFilter, setRecipientFilter] = useState<"ALL" | "SENT" | "FAILED">("ALL");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const updateUrl = (updates: {
    q?: string;
    scope?: string;
    status?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.q !== undefined) {
      const trimmed = updates.q.trim();
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      params.delete("search"); // normalisasi ke parameter 'q'
    }

    if (updates.scope !== undefined) {
      if (updates.scope && updates.scope !== "ALL") {
        params.set("scope", updates.scope);
      } else {
        params.delete("scope");
      }
    }

    if (updates.status !== undefined) {
      if (updates.status && updates.status !== "ALL") {
        params.set("status", updates.status);
      } else {
        params.delete("status");
      }
    }

    if (updates.page !== undefined) {
      if (updates.page > 1) {
        params.set("page", String(updates.page));
      } else {
        params.delete("page");
      }
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  // Debounce 400ms untuk pencarian teks
  useEffect(() => {
    if (searchQuery.trim() === urlQ.trim()) return;

    const timer = setTimeout(() => {
      updateUrl({ q: searchQuery, page: 1 });
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, urlQ]);

  const handleScopeChange = (newScope: string) => {
    updateUrl({ scope: newScope, page: 1 });
  };

  const handleStatusChange = (newStatus: string) => {
    updateUrl({ status: newStatus, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > maxPages || newPage === currentPage) return;
    updateUrl({ page: newPage });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    updateUrl({ q: "", scope: "ALL", status: "ALL", page: 1 });
  };

  const handleOpenDetail = async (id: string) => {
    setSelectedBroadcastId(id);
    setIsLoadingDetail(true);
    setDetailError(null);
    setResendFeedback(null);
    setRecipientFilter("ALL");
    setRecipientSearch("");

    try {
      const res = await getBroadcastDetailAction(id);
      if (res.success && res.data) {
        setActiveDetail(res.data);
      } else {
        setDetailError(res.error || "Gagal memuat rincian pengumuman.");
      }
    } catch {
      setDetailError("Terjadi kesalahan jaringan saat mengambil detail pengumuman.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedBroadcastId(null);
    setActiveDetail(null);
    setDetailError(null);
    setResendFeedback(null);
  };

  const handleResendFailed = async (broadcastId: string) => {
    if (!window.confirm("Kirim ulang pengumuman ini ke seluruh penerima yang sebelumnya gagal?")) {
      return;
    }

    setIsResending(true);
    setResendFeedback(null);
    try {
      const res = await resendFailedBroadcastAction(broadcastId);
      if (res.success) {
        setResendFeedback({
          type: "success",
          message: res.message || "Penerima gagal berhasil dimasukkan kembali ke antrean pengiriman.",
        });
        // Muat ulang rincian pengumuman terbaru
        const refreshed = await getBroadcastDetailAction(broadcastId);
        if (refreshed.success && refreshed.data) {
          setActiveDetail(refreshed.data);
        }
        router.refresh();
      } else {
        setResendFeedback({
          type: "error",
          message: res.error || "Gagal mengirim ulang pengumuman.",
        });
      }
    } catch (err: unknown) {
      setResendFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Terjadi kesalahan saat memproses pengiriman ulang.",
      });
    } finally {
      setIsResending(false);
    }
  };

  const [isCancelingSchedule, setIsCancelingSchedule] = useState(false);

  const handleCancelSchedule = async (broadcastId: string) => {
    if (
      !window.confirm(
        "Batalkan jadwal pengiriman broadcast ini? Pengumuman tidak akan dikirim dan status akan diubah menjadi DIBATALKAN.",
      )
    ) {
      return;
    }

    setIsCancelingSchedule(true);
    try {
      const res = await cancelScheduledBroadcastAction(broadcastId);
      if (res.success) {
        alert("Jadwal pengiriman pengumuman berhasil dibatalkan.");
        if (selectedBroadcastId === broadcastId) {
          handleCloseDetail();
        }
        router.refresh();
      } else {
        alert(res.error || "Gagal membatalkan jadwal pengumuman.");
      }
    } catch (err: unknown) {
      console.error("Gagal membatalkan jadwal:", err);
      alert("Terjadi kesalahan saat membatalkan jadwal pengumuman.");
    } finally {
      setIsCancelingSchedule(false);
    }
  };

  // Filtered recipients in modal
  const filteredRecipients = useMemo(() => {
    if (!activeDetail) return [];
    return activeDetail.recipients.filter((rcpt) => {
      const matchStatus =
        recipientFilter === "ALL" || rcpt.status === recipientFilter;

      const matchSearch =
        recipientSearch.trim() === "" ||
        rcpt.recipientName.toLowerCase().includes(recipientSearch.toLowerCase()) ||
        rcpt.email.toLowerCase().includes(recipientSearch.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [activeDetail, recipientFilter, recipientSearch]);

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() || activeScope !== "ALL" || activeStatus !== "ALL",
  );

  return (
    <div className="space-y-6">
      {/* --- STATS SUMMARY CARDS --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-navy-50 text-navy-800">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-600 font-medium">Total Pengumuman</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              {stats.totalBroadcasts}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-600 font-medium">Email Terkirim</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              {stats.totalEmailsSent}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-50 text-red-700">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-600 font-medium">Email Gagal</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              {stats.totalEmailsFailed}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-600 font-medium">Keterkiriman</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              {stats.successRate}%
            </h3>
          </div>
        </div>
      </div>

      {/* --- SEARCH & FILTERS BAR --- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari subjek, pengirim, atau isi pengumuman..."
            className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent text-slate-900"
          />
          {isPending && (
            <Loader2 className="w-4 h-4 text-navy-800 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Filter */}
          <select
            value={activeScope}
            onChange={(e) => handleScopeChange(e.target.value)}
            disabled={isPending}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 font-medium text-slate-700 cursor-pointer disabled:opacity-60"
          >
            <option value="ALL">Semua Sasaran</option>
            <option value="ALL_EMPLOYEES">Organisasi (Semua Staf)</option>
            <option value="DEPARTMENT">Per Divisi</option>
            <option value="TEAM">Tim Bawahan</option>
            <option value="CUSTOM">Karyawan Kustom</option>
          </select>

          {/* Status Filter */}
          <select
            value={activeStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isPending}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 font-medium text-slate-700 cursor-pointer disabled:opacity-60"
          >
            <option value="ALL">Semua Status</option>
            <option value="SCHEDULED">Terjadwal</option>
            <option value="QUEUED">Dalam Antrean</option>
            <option value="SENDING">Sedang Dikirim</option>
            <option value="SENT">100% Terkirim</option>
            <option value="PARTIALLY_FAILED">Sebagian Gagal</option>
            <option value="FAILED">Gagal Total</option>
            <option value="CANCELED">Dibatalkan</option>
          </select>

          {canCreate && (
            <Link
              href="/komunikasi/baru"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#102E50] hover:bg-[#0c233d] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-gold-400" />
              <span>Tulis Pengumuman</span>
            </Link>
          )}
        </div>
      </div>

      {/* --- BROADCAST ITEMS LIST --- */}
      {displayItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500">
            <Inbox className="w-6 h-6" />
          </div>
          <h4 className="font-semibold text-sm text-slate-900">
            {hasActiveFilters
              ? "Belum Ada Pengumuman Ditemukan"
              : "Belum Ada Pengumuman Terkirim"}
          </h4>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            {hasActiveFilters
              ? "Tidak ada riwayat pengumuman yang sesuai dengan kriteria filter yang Anda tentukan."
              : "Belum ada email broadcast pengumuman resmi yang dikirimkan melalui sistem."}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>Reset Filter</span>
              </button>
            )}
            {canCreate && (
              <Link
                href="/komunikasi/baru"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#102E50] text-white rounded-xl text-xs font-semibold hover:bg-[#0c233d] transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-gold-400" />
                <span>Buat Pengumuman Baru</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className={`space-y-3 transition-opacity duration-150 ${
              isPending ? "opacity-60 pointer-events-none" : "opacity-100"
            }`}
          >
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-navy-300 shadow-xs hover:shadow-sm transition-all p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Scope Badge */}
                    <span
                      className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        item.targetScope === "ALL_EMPLOYEES"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : item.targetScope === "DEPARTMENT"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : item.targetScope === "CUSTOM"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {item.targetScope === "ALL_EMPLOYEES"
                        ? "ORGANISASI"
                        : item.targetScope === "DEPARTMENT"
                          ? `DIVISI: ${item.targetDepartmentName || ""}`
                          : item.targetScope === "CUSTOM"
                            ? "PEGAWAI TERPILIH"
                            : "TIM BAWAHAN"}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                        item.status === "SCHEDULED"
                          ? "bg-amber-50 text-amber-900 border border-amber-300"
                          : item.status === "QUEUED"
                            ? "bg-slate-100 text-slate-700 border border-slate-200"
                            : item.status === "SENDING"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : item.status === "SENT"
                                ? "bg-emerald-50 text-emerald-700"
                                : item.status === "PARTIALLY_FAILED"
                                  ? "bg-amber-50 text-amber-700"
                                  : item.status === "CANCELED"
                                    ? "bg-slate-100 text-slate-500"
                                    : "bg-red-50 text-red-700"
                      }`}
                    >
                      {item.status === "SCHEDULED" ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>
                            Terjadwal{" "}
                            {item.scheduledAt
                              ? `(${formatDateTime(item.scheduledAt)})`
                              : ""}
                          </span>
                        </>
                      ) : item.status === "QUEUED" ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Dalam Antrean</span>
                        </>
                      ) : item.status === "SENDING" ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                          <span>
                            Sedang Dikirim ({item.sentCount + item.failedCount}/{item.totalRecipients})
                          </span>
                        </>
                      ) : item.status === "SENT" ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {item.sentCount}/{item.totalRecipients} Terkirim
                          </span>
                        </>
                      ) : item.status === "PARTIALLY_FAILED" ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            {item.sentCount}/{item.totalRecipients} Terkirim
                          </span>
                        </>
                      ) : item.status === "CANCELED" ? (
                        <span>Dibatalkan</span>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          <span>Gagal Total</span>
                        </>
                      )}
                    </span>

                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      {item.subject}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                      {item.contentSnippet}
                    </p>
                  </div>

                  {/* Progress Bar untuk Broadcast yang Sedang Diproses */}
                  {(item.status === "SENDING" || item.status === "QUEUED") && (
                    <div className="pt-1.5 space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Progres pengiriman:</span>
                        <span className="font-semibold text-navy-900">
                          {item.sentCount + item.failedCount} / {item.totalRecipients} (
                          {Math.round(
                            ((item.sentCount + item.failedCount) /
                              Math.max(1, item.totalRecipients)) *
                              100,
                          )}
                          %)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            item.status === "QUEUED" ? "bg-slate-400" : "bg-blue-600"
                          }`}
                          style={{
                            width: `${Math.round(
                              ((item.sentCount + item.failedCount) /
                                Math.max(1, item.totalRecipients)) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-1">
                    <span className="font-medium text-slate-800">
                      Dari: {item.senderName}
                    </span>
                    <span>•</span>
                    <span className="text-slate-600">
                      Balasan: {item.replyToEmail || "no-reply@pspk.id"}
                    </span>
                    {item.sendInApp && (
                      <>
                        <span>•</span>
                        <span className="text-navy-800 font-medium flex items-center gap-1">
                          ✓ Notifikasi In-App
                        </span>
                      </>
                    )}
                    {item.attachmentCount !== undefined && item.attachmentCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-slate-700 font-medium flex items-center gap-1">
                          <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.attachmentCount} Lampiran PDF</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:self-center shrink-0">
                  {item.status === "SCHEDULED" && item.canCancelSchedule && (
                    <button
                      type="button"
                      onClick={() => handleCancelSchedule(item.id)}
                      disabled={isCancelingSchedule}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      title="Batalkan jadwal pengiriman broadcast ini"
                    >
                      {isCancelingSchedule ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Ban className="w-3.5 h-3.5 text-red-600" />
                      )}
                      <span>Batalkan Jadwal</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(item.id)}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-navy-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-navy-800" />
                    <span>Lihat Rincian &amp; Log</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION BAR */}
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Halaman <strong className="text-slate-900">{currentPage}</strong> dari{" "}
                <strong className="text-slate-900">{maxPages}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span>
                Total <strong className="text-slate-900">{totalCount}</strong> pengumuman
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isPending}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= maxPages || isPending}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DETAIL & RECIPIENTS MODAL --- */}
      {selectedBroadcastId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#102E50] text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gold-400">
                  Rincian Pengumuman &amp; Log Penerima
                </span>
                <h3 className="font-bold text-base line-clamp-1 mt-0.5">
                  {activeDetail?.subject || "Memuat Pengumuman..."}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="text-slate-300 hover:text-white transition-colors p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {isLoadingDetail ? (
                <PspkLoader
                  fullScreen={false}
                  size={64}
                  label="Memuat rincian dan log penerima..."
                />
              ) : detailError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                  {detailError}
                </div>
              ) : activeDetail ? (
                <>
                  {resendFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                        resendFeedback.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                    >
                      {resendFeedback.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                      <span>{resendFeedback.message}</span>
                    </div>
                  )}

                  {activeDetail.status === "SCHEDULED" && (
                    <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
                      <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-amber-900">
                          Pengumuman Terjadwal
                        </span>
                        <span className="text-amber-800 leading-relaxed block mt-0.5">
                          Pengumuman ini dijadwalkan untuk dikirim pada{" "}
                          <strong>
                            {activeDetail.scheduledAt
                              ? formatDateTime(activeDetail.scheduledAt) + " WIB"
                              : "waktu yang ditentukan"}
                          </strong>
                          . Daftar penerima aktual akan dievaluasi dan diproses otomatis oleh sistem saat waktu pengiriman tiba.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Meta Bar */}
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-600">Atas Nama Pengirim:</span>
                        <p className="font-semibold text-slate-900 mt-0.5">
                          {activeDetail.senderName}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-600">Alamat Balasan (Reply-To):</span>
                        <p className="font-semibold text-slate-900 font-mono text-xs mt-0.5">
                          {activeDetail.replyToEmail || "no-reply@pspk.id (Satu Arah)"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-600">
                          {activeDetail.status === "SCHEDULED"
                            ? "Jadwal Pengiriman:"
                            : "Waktu Kirim:"}
                        </span>
                        <p className="font-semibold text-slate-900 mt-0.5">
                          {activeDetail.status === "SCHEDULED" && activeDetail.scheduledAt
                            ? `${formatDateTime(activeDetail.scheduledAt)} WIB`
                            : formatDateTime(activeDetail.createdAt)}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-600">Status Keterkiriman:</span>
                        <p
                          className={`font-semibold mt-0.5 ${
                            activeDetail.failedCount > 0 ? "text-amber-700" : "text-emerald-700"
                          }`}
                        >
                          {activeDetail.sentCount} dari {activeDetail.totalRecipients} penerima terkirim
                          {activeDetail.failedCount > 0 && ` (${activeDetail.failedCount} gagal)`}
                        </p>
                      </div>
                      {activeDetail.excludedCount !== undefined && activeDetail.excludedCount > 0 && (
                        <div className="sm:col-span-2 pt-1 border-t border-slate-200/60">
                          <span className="text-slate-600">Pegawai Dikecualikan:</span>
                          <p className="font-semibold text-amber-700 mt-0.5">
                            {activeDetail.excludedCount} Orang
                            {activeDetail.excludedEmployeeNames &&
                              activeDetail.excludedEmployeeNames.length > 0 && (
                                <span className="text-slate-600 font-normal block text-xs mt-0.5">
                                  ({activeDetail.excludedEmployeeNames.join(", ")})
                                </span>
                              )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Naskah Pesan Asli */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Naskah Pengumuman Terkirim:
                    </h4>
                    <div
                      className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 tiptap-editor overflow-hidden leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: activeDetail.contentHtml }}
                    />
                  </div>

                  {/* Lampiran Dokumen PDF (jika ada) */}
                  {activeDetail.attachments && activeDetail.attachments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-navy-800" />
                        <span>Lampiran Dokumen PDF ({activeDetail.attachments.length} berkas):</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeDetail.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs transition-colors group cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <div className="p-2 bg-red-50 text-red-600 rounded-lg shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-900 group-hover:text-navy-900 truncate block">
                                  {att.fileName}
                                </span>
                                <span className="text-slate-500 text-xs block">
                                  {(att.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                                </span>
                              </div>
                            </div>
                            <Download className="w-4 h-4 text-slate-400 group-hover:text-navy-900 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Log Rincian Penerima */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Log Penerima ({activeDetail.recipients.length} Karyawan)
                      </h4>

                      {/* Recipient status filter */}
                      <div className="flex items-center gap-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setRecipientFilter("ALL")}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                            recipientFilter === "ALL"
                              ? "bg-[#102E50] text-white"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          Semua ({activeDetail.recipients.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecipientFilter("SENT")}
                          className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                            recipientFilter === "SENT"
                              ? "bg-emerald-700 text-white font-semibold"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          Sukses ({activeDetail.sentCount})
                        </button>
                        {activeDetail.failedCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setRecipientFilter("FAILED")}
                            className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                              recipientFilter === "FAILED"
                                ? "bg-red-700 text-white font-semibold"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            Gagal ({activeDetail.failedCount})
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Recipient search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                        placeholder="Saring nama atau email penerima..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 text-slate-900"
                      />
                    </div>

                    {/* Table of recipients */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                          <tr>
                            <th className="py-2 px-3">Nama Pegawai</th>
                            <th className="py-2 px-3">Email Kantor</th>
                            <th className="py-2 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredRecipients.map((rcpt) => (
                            <tr key={rcpt.id} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-medium text-slate-900">
                                {rcpt.recipientName}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-600">
                                {rcpt.email}
                              </td>
                              <td className="py-2 px-3">
                                {rcpt.status === "SENT" ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Terkirim</span>
                                  </span>
                                ) : (
                                  <div className="space-y-0.5">
                                    <span
                                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full"
                                      title={rcpt.errorMessage || "Gagal mengirim"}
                                    >
                                      <AlertCircle className="w-3 h-3" />
                                      <span>Gagal</span>
                                    </span>
                                    {rcpt.errorMessage && (
                                      <p className="text-xs text-red-600 font-normal leading-tight max-w-xs break-words">
                                        {rcpt.errorMessage}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {activeDetail?.canCancelSchedule && (
                  <button
                    type="button"
                    onClick={() => handleCancelSchedule(activeDetail.id)}
                    disabled={isCancelingSchedule}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isCancelingSchedule ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Membatalkan Jadwal...</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5" />
                        <span>Batalkan Jadwal Pengumuman</span>
                      </>
                    )}
                  </button>
                )}
                {activeDetail?.canResend && (
                  <button
                    type="button"
                    onClick={() => handleResendFailed(activeDetail.id)}
                    disabled={isResending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memproses Ulang...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Kirim Ulang yang Gagal ({activeDetail.failedCount})</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
