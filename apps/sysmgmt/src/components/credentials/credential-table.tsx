"use client";

import React, { useState } from "react";
import { SerializedCredential } from "@/server/queries/credential.queries";
import { formatDate } from "@pspk/shared";
import {
  KeyRound,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  ClockAlert,
  CheckCircle2,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { CATEGORY_META, TWO_FACTOR_META } from "./credential-constants";

interface CredentialTableProps {
  credentials: SerializedCredential[];
  canManage: boolean;
  canReveal: boolean;
  onEditCredential?: (credential: SerializedCredential) => void;
  onDeleteCredential?: (credential: SerializedCredential) => void;
  onRevealPassword?: (credential: SerializedCredential) => void;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  onPageChange: (newPage: number) => void;
}

export function CredentialTable({
  credentials,
  canManage,
  canReveal,
  onEditCredential,
  onDeleteCredential,
  onRevealPassword,
  pagination,
  onPageChange,
}: CredentialTableProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyText = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error("Gagal menyalin teks:", err);
    }
  };

  if (credentials.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200">
          <KeyRound className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 font-serif">
          Tidak Ada Akun Kredensial Ditemukan
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Tidak ada data akun atau kredensial yang cocok dengan kriteria pencarian dan filter yang Anda pilih.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4 pl-6">Akun / Layanan</th>
              <th className="py-3.5 px-4">Identitas Login</th>
              <th className="py-3.5 px-4">Password</th>
              <th className="py-3.5 px-4">Proteksi 2FA</th>
              <th className="py-3.5 px-4">Penanggung Jawab (PIC)</th>
              <th className="py-3.5 px-4">Status & Rotasi</th>
              <th className="py-3.5 px-4 pr-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {credentials.map((cred) => {
              const catMeta = CATEGORY_META[cred.category];
              const twoFactorMeta = TWO_FACTOR_META[cred.twoFactorType];
              const CategoryIcon = catMeta?.icon || KeyRound;
              const TwoFactorIcon = twoFactorMeta?.icon || ShieldAlert;

              return (
                <tr key={cred.id} className="hover:bg-slate-50/70 transition-colors group">
                  {/* Kolom 1: Akun & Kategori */}
                  <td className="py-4 px-4 pl-6 align-top">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl ${catMeta?.iconBgClass || "bg-slate-50"} border border-slate-200 flex items-center justify-center ${catMeta?.iconTextClass || "text-slate-600"} shrink-0 shadow-2xs mt-0.5`}
                      >
                        <CategoryIcon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm leading-tight">
                            {cred.title}
                          </span>
                          {cred.url && (
                            <a
                              href={cred.url}
                              target="_blank"
                              rel="noreferrer"
                              title={`Buka ${cred.url}`}
                              className="text-slate-400 hover:text-sky-600 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catMeta?.badgeClass || "bg-slate-50 text-slate-700 border-slate-200"}`}
                          >
                            {catMeta?.label || cred.category}
                          </span>
                          {!cred.isActive && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Nonaktif
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Kolom 2: Identitas Login (Username / Email) */}
                  <td className="py-4 px-4 align-top">
                    <div className="space-y-1.5">
                      {cred.username && (
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <span className="text-slate-400 font-mono text-[11px]">user:</span>
                          <span className="font-mono font-medium truncate max-w-[150px]">
                            {cred.username}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(cred.username!, `user-${cred.id}`)}
                            title="Salin Username"
                            className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                          >
                            {copiedKey === `user-${cred.id}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}
                      {cred.email && (
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <span className="text-slate-400 font-mono text-[11px]">email:</span>
                          <span className="font-mono text-slate-600 truncate max-w-[150px]">
                            {cred.email}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(cred.email!, `email-${cred.id}`)}
                            title="Salin Email"
                            className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                          >
                            {copiedKey === `email-${cred.id}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}
                      {!cred.username && !cred.email && (
                        <span className="text-slate-400 italic text-[11px]">Tidak dicatat</span>
                      )}
                    </div>
                  </td>

                  {/* Kolom 3: Password (Masked + Reveal Action) */}
                  <td className="py-4 px-4 align-top">
                    {cred.hasPassword ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 text-xs tracking-widest bg-slate-100 px-2 py-1 rounded-md border border-slate-200 select-none">
                          ••••••••••••
                        </span>
                        {canReveal ? (
                          <button
                            type="button"
                            onClick={() => onRevealPassword?.(cred)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-semibold transition-colors shadow-2xs"
                            title="Buka dan lihat password terenkripsi"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Buka</span>
                          </button>
                        ) : (
                          <span
                            className="p-1 text-slate-300"
                            title="Hanya Super Admin & IT Admin yang dapat membuka password"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Tidak ada password</span>
                    )}
                  </td>

                  {/* Kolom 4: Proteksi 2FA */}
                  <td className="py-4 px-4 align-top">
                    <div className="space-y-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${twoFactorMeta?.badgeClass || "bg-slate-50 text-slate-600 border-slate-200"}`}
                      >
                        <TwoFactorIcon className="w-3 h-3" />
                        <span>{twoFactorMeta?.shortLabel || cred.twoFactorType}</span>
                      </span>
                      {(cred.recoveryEmail || cred.recoveryPhone) && (
                        <span className="text-[10px] text-slate-400 block">
                          Recovery: {cred.recoveryEmail ? "Email" : ""}{" "}
                          {cred.recoveryPhone ? "No. HP" : ""}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Kolom 5: PIC Penanggung Jawab */}
                  <td className="py-4 px-4 align-top">
                    {cred.picEmployee ? (
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 leading-tight">
                          {cred.picEmployee.fullName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {cred.picEmployee.positionTitle ||
                            cred.picEmployee.departmentName ||
                            cred.picEmployee.employeeNo}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">
                        Milik Bersama Lembaga
                      </span>
                    )}
                  </td>

                  {/* Kolom 6: Status & Rotasi */}
                  <td className="py-4 px-4 align-top">
                    <div className="space-y-1">
                      {cred.needsRotation ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                          <ClockAlert className="w-3 h-3 text-amber-600" />
                          <span>
                            {cred.daysSinceRotation !== null
                              ? `Rotasi (${cred.daysSinceRotation}h)`
                              : "Belum Pernah Rotasi"}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>
                            {cred.daysSinceRotation !== null
                              ? `${cred.daysSinceRotation} hari lalu`
                              : "Baru"}
                          </span>
                        </div>
                      )}
                      {cred.lastRotatedAt && (
                        <span className="text-[10px] text-slate-400 block">
                          {formatDate(cred.lastRotatedAt)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Kolom 7: Aksi */}
                  <td className="py-4 px-4 pr-6 align-top text-right">
                    {canManage ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEditCredential?.(cred)}
                          className="p-1.5 text-slate-500 hover:text-[#102E50] hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Akun"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCredential?.(cred)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-300 text-[11px]">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-600">
        <div>
          Menampilkan <span className="font-semibold text-slate-900">{credentials.length}</span> dari{" "}
          <span className="font-semibold text-slate-900">{pagination.total}</span> total akun kredensial
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>
          <span className="text-xs font-medium text-slate-500 px-1">
            Halaman {pagination.page} dari {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
          >
            <span>Berikutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
