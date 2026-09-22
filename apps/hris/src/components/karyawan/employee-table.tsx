"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@pspk/shared";
import {
  Eye,
  Edit,
  UserX,
  AlertCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { StatusBadge, ContractTypeBadge } from "./status-badge";
import { deleteEmployeeAction } from "@/server/actions/employee.actions";

export interface EmployeeListItem {
  id: string;
  employeeNo: string;
  fullName: string;
  nickname: string | null;
  workEmail: string;
  phone: string | null;
  photoKey: string | null;
  status: string;
  joinDate: Date;
  endDate: Date | null;
  currentDepartment: { id: string; name: string } | null;
  currentPosition: { id: string; title: string } | null;
  manager: { id: string; fullName: string } | null;
  activeContract: {
    id: string;
    type: string;
    startDate: Date;
    endDate: Date | null;
    baseSalary: number | null;
  } | null;
  isExpiringSoon: boolean;
  daysUntilExpiry: number | null;
}

interface EmployeeTableProps {
  items: EmployeeListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function EmployeeTable({
  items,
  total,
  page,
  pageSize,
  totalPages,
}: EmployeeTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedForDelete, setSelectedForDelete] = React.useState<EmployeeListItem | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Pagination handler
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(newPage));
    startTransition(() => {
      router.push(url.pathname + url.search);
    });
  };

  // Delete / Deactivate handler
  const confirmDelete = async () => {
    if (!selectedForDelete) return;
    setIsDeleting(true);
    setActionError(null);

    const res = await deleteEmployeeAction(selectedForDelete.id);
    setIsDeleting(false);

    if (res.ok) {
      setSelectedForDelete(null);
      router.refresh();
    } else {
      setActionError(res.error || "Gagal menonaktifkan pegawai.");
    }
  };

  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-4">
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 text-[#A8281C] text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 select-none">
                <th className="py-3 px-4">Pegawai</th>
                <th className="py-3 px-4">NIP & Mulai Kerja</th>
                <th className="py-3 px-4">Posisi & Divisi</th>
                <th className="py-3 px-4">Atasan Langsung</th>
                <th className="py-3 px-4">Kontrak & Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col gap-1 max-w-sm">
                        <span className="font-semibold text-slate-800">
                          Tidak Ada Data Pegawai
                        </span>
                        <span className="text-xs text-slate-500">
                          Tidak ditemukan pegawai yang cocok dengan filter atau kata kunci pencarian Anda.
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((emp) => {
                  const initial = emp.fullName.charAt(0).toUpperCase();

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/70 transition-colors duration-150 group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#102E50]/10 text-[#102E50] font-bold flex items-center justify-center text-sm shrink-0 border border-[#102E50]/20">
                            {initial}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <Link
                              href={`/karyawan/${emp.id}`}
                              className="font-semibold text-slate-900 hover:text-[#102E50] transition-colors truncate group-hover:underline"
                            >
                              {emp.fullName}
                            </Link>
                            <span className="text-xs text-slate-500 truncate">
                              {emp.workEmail}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* NIP & Join Date */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 tracking-tight">
                            {emp.employeeNo}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {formatDate(emp.joinDate)}
                          </span>
                        </div>
                      </td>

                      {/* Position & Department */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 text-xs truncate max-w-[200px]">
                            {emp.currentPosition?.title || "-"}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {emp.currentDepartment?.name || "-"}
                          </span>
                        </div>
                      </td>

                      {/* Manager */}
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {emp.manager ? (
                          <span className="font-medium text-slate-800 truncate block max-w-[150px]">
                            {emp.manager.fullName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Direksi / Mandiri</span>
                        )}
                      </td>

                      {/* Contract & Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <StatusBadge status={emp.status} size="sm" />
                            {emp.activeContract && (
                              <ContractTypeBadge type={emp.activeContract.type} />
                            )}
                          </div>

                          {/* Expiring Soon Alert Chip */}
                          {emp.isExpiringSoon && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-[#805600] border border-amber-300">
                              <Clock className="w-3 h-3 text-[#805600]" />
                              <span>Sisa {emp.daysUntilExpiry} hari</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Action Dropdown / Links */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/karyawan/${emp.id}`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#102E50] hover:bg-slate-100 transition-colors"
                            title="Lihat Detail Profil"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/karyawan/${emp.id}/ubah`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#102E50] hover:bg-slate-100 transition-colors"
                            title="Ubah Data Pegawai"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setSelectedForDelete(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#A8281C] hover:bg-red-50 transition-colors cursor-pointer"
                            title="Nonaktifkan Pegawai"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {total > 0 && (
          <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Menampilkan <span className="font-bold text-slate-800">{startRecord}</span> hingga{" "}
              <span className="font-bold text-slate-800">{endRecord}</span> dari{" "}
              <span className="font-bold text-slate-800">{total}</span> pegawai
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || isPending}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>

              <span className="px-2 py-1 font-semibold text-slate-800">
                Halaman {page} dari {totalPages}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages || isPending}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Deactivate / Delete */}
      {selectedForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-[#A8281C] shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Konfirmasi Nonaktifkan Pegawai
                </h3>
                <span className="text-xs text-slate-500">
                  Tindakan ini memerlukan perhatian khusus
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menonaktifkan pegawai{" "}
              <strong className="text-slate-900">{selectedForDelete.fullName}</strong> (
              {selectedForDelete.employeeNo})?
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
              Penonaktifan akan mengubah status menjadi <strong>TERMINATED</strong>, menghentikan seluruh kontrak aktif yang berjalan, dan menonaktifkan akses akun pengguna terkait. Seluruh riwayat akan tetap diarsipkan di sistem.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedForDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#A8281C] text-white hover:bg-[#851e14] transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                {isDeleting ? "Memproses..." : "Ya, Nonaktifkan Pegawai"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
