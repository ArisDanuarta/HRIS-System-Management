"use client";

import React, { useState } from "react";
import { SerializedAuditLog } from "@/server/queries/audit.queries";
import { formatDateTime } from "@pspk/shared";
import {
  X,
  History,
  Copy,
  Check,
  ShieldCheck,
  Globe,
  User,
  Layers,
  ArrowRight,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface AuditDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: SerializedAuditLog | null;
}

export function AuditDiffModal({ isOpen, onClose, log }: AuditDiffModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen || !log) return null;

  const handleCopyJson = () => {
    const payload = JSON.stringify(
      {
        id: log.id,
        occurredAt: log.occurredAt,
        actorEmail: log.actorEmail,
        app: log.app,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        before: log.before,
        after: log.after,
        ip: log.ip,
        userAgent: log.userAgent,
      },
      null,
      2,
    );

    navigator.clipboard.writeText(payload);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const hasBefore = log.before !== null && log.before !== undefined;
  const hasAfter = log.after !== null && log.after !== undefined;

  const renderJsonBlock = (title: string, data: unknown, colorClass: string) => {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <div className={`px-3 py-1.5 text-xs font-bold rounded-t-lg border-b ${colorClass} flex items-center justify-between`}>
          <span>{title}</span>
          <span className="text-[10px] font-mono opacity-70">JSON Payload</span>
        </div>
        <pre className="p-3 bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto rounded-b-lg border border-slate-800 max-h-80 select-all">
          {data ? JSON.stringify(data, null, 2) : "null"}
        </pre>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col transition-all duration-200 ${
          isExpanded ? "w-[95vw] h-[92vh]" : "max-w-4xl w-full max-h-[90vh]"
        }`}
      >
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
              <History className="w-5 h-5 text-[#102E50]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  Inspeksi Catatan Audit Log
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                  {log.action}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    log.app === "sysmgmt"
                      ? "bg-[#102E50]/10 text-[#102E50]"
                      : "bg-teal-50 text-teal-700 border border-teal-200"
                  }`}
                >
                  {log.app}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                ID: {log.id} • {formatDateTime(log.occurredAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              title="Salin seluruh JSON log ke clipboard"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Salin JSON</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={isExpanded ? "Perkecil tampilan" : "Perbesar tampilan"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Isi Modal */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Metadata Transaksi Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            {/* Aktor */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" /> Aktor
              </span>
              <p className="font-semibold text-slate-900 truncate" title={log.actorEmail}>
                {log.actorEmail}
              </p>
              <p className="text-[11px] font-mono text-slate-500 truncate">
                UID: {log.actorUserId || "-"}
              </p>
            </div>

            {/* Entitas */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3" /> Entitas Target
              </span>
              <p className="font-semibold text-slate-900">
                {log.entityType}
              </p>
              <p className="text-[11px] font-mono text-slate-500 truncate" title={log.entityId || ""}>
                ID: {log.entityId || "-"}
              </p>
            </div>

            {/* Jaringan & Klien */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3 h-3" /> Jaringan & Klien
              </span>
              <p className="font-mono text-slate-900">
                IP: {log.ip || "127.0.0.1"}
              </p>
              <p className="text-[11px] text-slate-500 truncate" title={log.userAgent || ""}>
                {log.userAgent || "-"}
              </p>
            </div>
          </div>

          {/* Banner Informasi Perlindungan Data */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Perlindungan Data Sensitif:</strong> Seluruh kata sandi, token autentikasi, kunci enkripsi, dan data pribadi yang terekam telah disamarkan secara otomatis menjadi <code className="px-1 py-0.5 rounded bg-amber-100 font-mono text-[11px]">[disembunyikan]</code>.
            </span>
          </div>

          {/* Komparasi JSON Diff Before vs After */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Rekaman Perubahan Data (Diff Payload)
            </h4>

            {hasBefore && hasAfter ? (
              <div className="flex flex-col md:flex-row gap-3">
                {renderJsonBlock("Data Sebelum (Before)", log.before, "bg-rose-900/10 text-rose-800 border-rose-200")}
                <div className="hidden md:flex items-center justify-center shrink-0">
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
                {renderJsonBlock("Data Sesudah (After)", log.after, "bg-emerald-900/10 text-emerald-800 border-emerald-200")}
              </div>
            ) : hasAfter ? (
              renderJsonBlock("Data Baru Dibuat (After)", log.after, "bg-emerald-900/10 text-emerald-800 border-emerald-200")
            ) : hasBefore ? (
              renderJsonBlock("Data Terakhir Sebelum Dihapus (Before)", log.before, "bg-rose-900/10 text-rose-800 border-rose-200")
            ) : (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                Tidak ada rekaman payload data tambahan pada aksi ini (misal aktivitas login/view biasa).
              </div>
            )}
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
