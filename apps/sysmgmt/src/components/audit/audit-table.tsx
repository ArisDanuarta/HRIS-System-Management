"use client";

import React from "react";
import { SerializedAuditLog } from "@/server/queries/audit.queries";
import { formatDateTime, formatRelativeTime } from "@pspk/shared";
import {
  Eye,
  History,
  ChevronLeft,
  ChevronRight,
  User,
  Globe,
  FileCode,
} from "lucide-react";

interface AuditTableProps {
  logs: SerializedAuditLog[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  onPageChange: (newPage: number) => void;
  onInspectLog: (log: SerializedAuditLog) => void;
}

export function AuditTable({
  logs,
  pagination,
  onPageChange,
  onInspectLog,
}: AuditTableProps) {
  const getActionBadgeClass = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "UPDATE":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "DELETE":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "LOGIN":
      case "LOGOUT":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "EXPORT":
        return "bg-amber-50 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getAppBadgeClass = (app: string) => {
    switch (app.toLowerCase()) {
      case "sysmgmt":
        return "bg-[#102E50]/10 text-[#102E50] border-[#102E50]/20";
      case "hris":
        return "bg-teal-50 text-teal-800 border-teal-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const fromRecord = (pagination.page - 1) * pagination.limit + 1;
  const toRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Tabel Data Log */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Waktu Transaksi</th>
              <th className="py-3 px-4">Portal</th>
              <th className="py-3 px-4">Aksi</th>
              <th className="py-3 px-4">Aktor Pengguna</th>
              <th className="py-3 px-4">Entitas Target</th>
              <th className="py-3 px-4">Alamat IP</th>
              <th className="py-3 px-4 text-right">Detail Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <History className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                    <p className="font-medium text-slate-600">Tidak ada rekaman audit log</p>
                    <p className="text-[11px] text-slate-400">
                      Coba sesuaikan kata kunci pencarian atau rentang tanggal filter Anda.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const hasPayload = log.before !== null || log.after !== null;

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onInspectLog(log)}
                  >
                    {/* Waktu */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">
                        {formatDateTime(log.occurredAt)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatRelativeTime(log.occurredAt)}
                      </div>
                    </td>

                    {/* Portal */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getAppBadgeClass(
                          log.app,
                        )}`}
                      >
                        {log.app}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getActionBadgeClass(
                          log.action,
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Aktor */}
                    <td className="py-3 px-4 max-w-xs truncate">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {log.actorEmail.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate" title={log.actorEmail}>
                            {log.actorEmail}
                          </p>
                          {log.actorUserId && (
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              UID: {log.actorUserId.substring(0, 8)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Entitas */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">
                        {log.entityType}
                      </span>
                      {log.entityId && (
                        <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[140px]" title={log.entityId}>
                          #{log.entityId}
                        </span>
                      )}
                    </td>

                    {/* IP Address */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {log.ip || "127.0.0.1"}
                    </td>

                    {/* Tombol Detail Diff */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectLog(log);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          hasPayload
                            ? "bg-slate-100 hover:bg-[#102E50] text-slate-700 hover:text-white"
                            : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        }`}
                        title="Lihat komparasi diff JSON sebelum vs sesudah"
                      >
                        {hasPayload ? (
                          <>
                            <FileCode className="w-3.5 h-3.5" />
                            <span>Inspeksi Diff</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginasi Footer */}
      {pagination.total > 0 && (
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan <span className="font-bold text-slate-800">{fromRecord}</span> -{" "}
            <span className="font-bold text-slate-800">{toRecord}</span> dari{" "}
            <span className="font-bold text-slate-800">{pagination.total.toLocaleString("id-ID")}</span> rekaman log
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-800">
              Hal {pagination.page} dari {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
