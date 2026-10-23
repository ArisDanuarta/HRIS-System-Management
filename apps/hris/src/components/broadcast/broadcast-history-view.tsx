"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
} from "lucide-react";
import {
  BroadcastHistoryItem,
  BroadcastHistoryStats,
  BroadcastDetailItem,
} from "../../server/queries/broadcast.queries";
import { getBroadcastDetailAction } from "../../server/actions/broadcast.actions";
import { PspkLoader } from "@pspk/ui";

interface BroadcastHistoryViewProps {
  initialItems: BroadcastHistoryItem[];
  stats: BroadcastHistoryStats;
  canCreate: boolean;
}

export function BroadcastHistoryView({
  initialItems,
  stats,
  canCreate,
}: BroadcastHistoryViewProps) {
  const [items] = useState<BroadcastHistoryItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [selectedScope, setSelectedScope] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Detail Modal State
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<BroadcastDetailItem | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [recipientFilter, setRecipientFilter] = useState<"ALL" | "SENT" | "FAILED">("ALL");
  const [recipientSearch, setRecipientSearch] = useState("");

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        search.trim() === "" ||
        item.subject.toLowerCase().includes(search.toLowerCase()) ||
        item.senderName.toLowerCase().includes(search.toLowerCase()) ||
        item.contentSnippet.toLowerCase().includes(search.toLowerCase());

      const matchScope =
        selectedScope === "ALL" || item.targetScope === selectedScope;

      const matchStatus =
        selectedStatus === "ALL" || item.status === selectedStatus;

      return matchSearch && matchScope && matchStatus;
    });
  }, [items, search, selectedScope, selectedStatus]);

  const handleOpenDetail = async (id: string) => {
    setSelectedBroadcastId(id);
    setIsLoadingDetail(true);
    setDetailError(null);
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

  return (
    <div className="space-y-6">
      {/* --- STATS SUMMARY CARDS --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-navy-50 text-navy-800">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Pengumuman</p>
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
            <p className="text-xs text-slate-500 font-medium">Email Terkirim</p>
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
            <p className="text-xs text-slate-500 font-medium">Email Gagal</p>
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
            <p className="text-xs text-slate-500 font-medium">Keterkiriman</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              {stats.successRate}%
            </h3>
          </div>
        </div>
      </div>

      {/* --- SEARCH & FILTERS BAR --- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari subjek, pengirim, atau isi pengumuman..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Filter */}
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 font-medium text-slate-700"
          >
            <option value="ALL">Semua Sasaran</option>
            <option value="ALL_EMPLOYEES">Organisasi (Semua Staf)</option>
            <option value="DEPARTMENT">Per Divisi</option>
            <option value="TEAM">Tim Bawahan</option>
            <option value="CUSTOM">Karyawan Kustom</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 font-medium text-slate-700"
          >
            <option value="ALL">Semua Status</option>
            <option value="SENT">100% Terkirim</option>
            <option value="PARTIALLY_FAILED">Sebagian Gagal</option>
            <option value="FAILED">Gagal Total</option>
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
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Inbox className="w-6 h-6" />
          </div>
          <h4 className="font-semibold text-sm text-slate-800">
            Belum Ada Pengumuman Ditemukan
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search || selectedScope !== "ALL" || selectedStatus !== "ALL"
              ? "Tidak ada riwayat pengumuman yang sesuai dengan kriteria filter yang Anda tentukan."
              : "Belum ada email broadcast pengumuman resmi yang dikirimkan melalui sistem."}
          </p>
          {canCreate && (
            <div className="pt-2">
              <Link
                href="/komunikasi/baru"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#102E50] text-white rounded-xl text-xs font-semibold hover:bg-[#0c233d] transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-gold-400" />
                <span>Buat Pengumuman Baru</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-navy-300 shadow-xs hover:shadow-sm transition-all p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Scope Badge */}
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      item.targetScope === "ALL_EMPLOYEES"
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : item.targetScope === "DEPARTMENT"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {item.targetScope === "ALL_EMPLOYEES"
                      ? "ORGANISASI"
                      : item.targetScope === "DEPARTMENT"
                        ? `DIVISI: ${item.targetDepartmentName || ""}`
                        : "TIM BAWAHAN"}
                  </span>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      item.status === "SENT"
                        ? "bg-emerald-50 text-emerald-700"
                        : item.status === "PARTIALLY_FAILED"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    {item.status === "SENT" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : item.status === "PARTIALLY_FAILED" ? (
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-600" />
                    )}
                    <span>
                      {item.sentCount}/{item.totalRecipients} Terkirim
                    </span>
                  </span>

                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDateTime(item.createdAt)}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {item.subject}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                    {item.contentSnippet}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-1">
                  <span className="font-medium text-slate-700">
                    Dari: {item.senderName}
                  </span>
                  <span>•</span>
                  <span className="text-slate-500">
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
                </div>
              </div>

              <div className="flex items-center gap-2 md:self-center">
                <button
                  type="button"
                  onClick={() => handleOpenDetail(item.id)}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-navy-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-navy-800" />
                  <span>Lihat Rincian &amp; Log</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- DETAIL & RECIPIENTS MODAL --- */}
      {selectedBroadcastId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#102E50] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400">
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
                  {/* Meta Bar */}
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500">Atas Nama Pengirim:</span>
                        <p className="font-semibold text-slate-900 mt-0.5">
                          {activeDetail.senderName}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Alamat Balasan (Reply-To):</span>
                        <p className="font-semibold text-slate-900 font-mono text-[11px] mt-0.5">
                          {activeDetail.replyToEmail || "no-reply@pspk.id (Satu Arah)"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Waktu Kirim:</span>
                        <p className="font-semibold text-slate-900 mt-0.5">
                          {formatDateTime(activeDetail.createdAt)}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Status Keterkiriman:</span>
                        <p className="font-semibold text-emerald-700 mt-0.5">
                          {activeDetail.sentCount} dari {activeDetail.totalRecipients} Penerima Sukses
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Naskah Pesan Asli */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Naskah Pengumuman Terkirim:
                    </h4>
                    <div
                      className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 tiptap-editor overflow-hidden leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: activeDetail.contentHtml }}
                    />
                  </div>

                  {/* Log Rincian Penerima */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Log Penerima ({activeDetail.recipients.length} Karyawan)
                      </h4>

                      {/* Recipient status filter */}
                      <div className="flex items-center gap-1 text-[11px]">
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
                          className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
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
                            className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
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
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                        placeholder="Saring nama atau email penerima..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600"
                      />
                    </div>

                    {/* Table of recipients */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
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
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Terkirim</span>
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full"
                                    title={rcpt.errorMessage || "Gagal mengirim"}
                                  >
                                    <AlertCircle className="w-3 h-3" />
                                    <span>Gagal</span>
                                  </span>
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
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={handleCloseDetail}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
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
