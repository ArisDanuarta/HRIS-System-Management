"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Send,
  Users,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
  PenLine,
  Mail,
  Bell,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Info,
  Check,
  Landmark,
  User,
  Reply,
  Sparkles,
} from "lucide-react";
import { RichTextEditor } from "./rich-text-editor";
import { BroadcastEmailPreview } from "./broadcast-email-preview";
import {
  getReplyToDisplayLabel,
  isBulkBroadcast,
  extractContentSummary,
} from "./broadcast-form-utils";
import {
  sendBroadcastAction,
  BroadcastFormData,
} from "../../server/actions/broadcast.actions";
import {
  SenderPersona,
  ReplyToMode,
  resolveSenderIdentity,
  hasDeliverableEmail,
} from "../../server/schemas/broadcast.schema";

interface BroadcastCreateFormProps {
  initialData: BroadcastFormData;
}

export function BroadcastCreateForm({ initialData }: BroadcastCreateFormProps) {
  const router = useRouter();
  const { senderCtx, departments, employees, teamMembers } = initialData;

  const canSendAll = senderCtx.canSendAll;
  const isManagerEmpty = !canSendAll && teamMembers.length === 0;

  // Form State
  const [targetScope, setTargetScope] = useState<
    "ALL_EMPLOYEES" | "DEPARTMENT" | "TEAM" | "CUSTOM"
  >(canSendAll ? "ALL_EMPLOYEES" : "TEAM");

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    departments[0]?.id || "",
  );
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  // Sender Persona & Reply-To State
  const [senderExpanded, setSenderExpanded] = useState(false);
  const [senderPersona, setSenderPersona] = useState<SenderPersona>(
    canSendAll ? "ORGANIZATION" : "PERSONAL",
  );
  const [customSenderName, setCustomSenderName] = useState("");
  const [replyToMode, setReplyToMode] = useState<ReplyToMode>("NO_REPLY");
  const [customReplyToEmail, setCustomReplyToEmail] = useState("");

  const [subject, setSubject] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [sendInApp, setSendInApp] = useState(true);

  // Active view tab for mobile / tablet (< lg): write vs preview
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  // Confirmation modal & submission state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAgreed, setConfirmAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    broadcastId?: string;
  } | null>(null);

  // Calculate resolved sender identity dynamically for live preview and modal
  const previewSender = resolveSenderIdentity(
    senderCtx,
    senderPersona,
    customSenderName,
    replyToMode,
    customReplyToEmail,
  );

  type Person = { id: string; fullName: string; workEmail: string };

  // Aturan identik dengan server: bukan pengirim & email valid
  const deliverable = (list: Person[]) =>
    list.filter(
      (p) => p.id !== senderCtx.employeeId && hasDeliverableEmail(p.workEmail),
    );

  const getRecipientSummary = () => {
    let label = "";
    let source: Person[] = [];

    if (targetScope === "TEAM") {
      label = "Anggota Tim Anda";
      source = teamMembers;
    } else if (targetScope === "DEPARTMENT") {
      const dept = departments.find((d) => d.id === selectedDepartmentId);
      label = `Divisi / Departemen ${dept?.name || ""}`;
      source = employees.filter((e) => e.departmentId === selectedDepartmentId);
    } else if (targetScope === "CUSTOM") {
      label = "Karyawan Tertentu";
      source = employees.filter((e) => selectedEmployeeIds.includes(e.id));
    } else {
      label = "Seluruh Karyawan Aktif";
      source = employees;
    }

    const list = deliverable(source);
    return {
      label,
      count: list.length,
      skipped: source.length - list.length,
      list,
    };
  };

  const recipientSummary = getRecipientSummary();
  const isBulk = isBulkBroadcast(targetScope, recipientSummary.count);
  const { snippet, imageCount } = extractContentSummary(contentHtml);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (senderPersona === "CUSTOM" && !customSenderName.trim()) {
      setSenderExpanded(true);
      setFeedback({
        type: "error",
        message: "Nama pengirim kustom wajib diisi jika memilih opsi persona Kustom.",
      });
      return;
    }

    if (replyToMode === "CUSTOM" && !customReplyToEmail.trim()) {
      setSenderExpanded(true);
      setFeedback({
        type: "error",
        message: "Alamat email balasan kustom wajib diisi jika memilih mode balasan Kustom.",
      });
      return;
    }

    if (subject.trim().length < 3) {
      setFeedback({
        type: "error",
        message: "Subjek pengumuman minimal 3 karakter.",
      });
      return;
    }

    if (!contentHtml.trim() || contentHtml === "<p></p>") {
      setFeedback({
        type: "error",
        message: "Isi naskah pesan pengumuman wajib diisi.",
      });
      return;
    }

    if (targetScope === "CUSTOM" && selectedEmployeeIds.length === 0) {
      setFeedback({
        type: "error",
        message: "Harap pilih minimal 1 orang karyawan penerima untuk target kustom.",
      });
      return;
    }

    if (targetScope === "TEAM" && teamMembers.length === 0) {
      setFeedback({
        type: "error",
        message: "Tidak ada anggota tim bawahan aktif yang terdaftar di bawah akun Anda.",
      });
      return;
    }

    setConfirmAgreed(false);
    setShowConfirmModal(true);
  };

  const handleExecuteSend = async () => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await sendBroadcastAction({
        subject,
        contentHtml,
        targetScope,
        targetDepartmentId:
          targetScope === "DEPARTMENT" ? selectedDepartmentId : undefined,
        customEmployeeIds:
          targetScope === "CUSTOM" ? selectedEmployeeIds : [],
        sendInApp,
        senderPersona,
        customSenderName: senderPersona === "CUSTOM" ? customSenderName.trim() : undefined,
        replyToMode,
        customReplyToEmail: replyToMode === "CUSTOM" ? customReplyToEmail.trim() : undefined,
      });

      if (res.success) {
        setShowConfirmModal(false);
        setFeedback({
          type: "success",
          message: res.message || "Pengumuman berhasil disebarkan!",
          broadcastId: res.broadcastId,
        });
        setSubject("");
        setContentHtml("");
      } else {
        setShowConfirmModal(false);
        setFeedback({
          type: "error",
          message: res.error || "Gagal mengirimkan pengumuman.",
        });
      }
    } catch {
      setShowConfirmModal(false);
      setFeedback({
        type: "error",
        message: "Terjadi kesalahan koneksi saat mengirim broadcast.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEmployeeSelection = (empId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId],
    );
  };

  return (
    <div className="space-y-6 pb-28">
      {/* FEEDBACK BANNER */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-xs animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-sm">
              {feedback.type === "success"
                ? "Pengumuman Berhasil Dikirimkan"
                : "Pengiriman Gagal"}
            </h4>
            <p className="text-xs text-slate-700 mt-0.5">{feedback.message}</p>

            {feedback.type === "success" && (
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/komunikasi/riwayat")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Lihat Riwayat Broadcast</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EMPTY STATE CALLOUT: MANAGER TANPA BAWAHAN */}
      {isManagerEmpty && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-amber-900">
              Belum Ada Anggota Tim di Bawah Supervisi Anda
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Anda belum dapat mengirimkan broadcast pengumuman tim karena belum ada anggota staf aktif yang terdaftar di bawah struktur organisasi Anda. Silakan hubungi Tim People &amp; Culture (HR) jika struktur ini keliru.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleOpenConfirm} className="space-y-6">
        <fieldset disabled={isManagerEmpty} className="contents disabled:opacity-60">
          {/* SECTION 1: TARGET PENERIMA */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-navy-800" />
                <h3 className="font-semibold text-sm text-slate-900">
                  1. Sasaran Target Penerima Email
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-navy-700" />
                <span>Pengirim: {senderCtx.userName} ({senderCtx.employeeTitle})</span>
              </div>
            </div>

            {/* ADMIN HR / SUPER ADMIN CHOICES */}
            {canSendAll ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTargetScope("ALL_EMPLOYEES")}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      targetScope === "ALL_EMPLOYEES"
                        ? "border-navy-900 bg-navy-50/50 ring-2 ring-navy-200 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900">
                        Seluruh Karyawan Aktif
                      </span>
                      {targetScope === "ALL_EMPLOYEES" && (
                        <Check className="w-4 h-4 text-navy-900" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Kirim ke seluruh {deliverable(employees).length} staf aktif institusi
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetScope("DEPARTMENT")}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      targetScope === "DEPARTMENT"
                        ? "border-navy-900 bg-navy-50/50 ring-2 ring-navy-200 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900">
                        Per Divisi / Departemen
                      </span>
                      {targetScope === "DEPARTMENT" && (
                        <Check className="w-4 h-4 text-navy-900" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Spesifik untuk salah satu divisi PSPK
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetScope("CUSTOM")}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      targetScope === "CUSTOM"
                        ? "border-navy-900 bg-navy-50/50 ring-2 ring-navy-200 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900">
                        Pilih Pegawai Tertentu
                      </span>
                      {targetScope === "CUSTOM" && (
                        <Check className="w-4 h-4 text-navy-900" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Pilih nama staf secara manual
                    </p>
                  </button>
                </div>

                {/* Sub-selector: Department */}
                {targetScope === "DEPARTMENT" && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-150">
                    <label className="block text-xs font-semibold text-slate-700">
                      Pilih Departemen Tujuan:
                    </label>
                    <select
                      value={selectedDepartmentId}
                      onChange={(e) => setSelectedDepartmentId(e.target.value)}
                      className="w-full sm:w-80 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sub-selector: Custom Employees Picker */}
                {targetScope === "CUSTOM" && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800">
                        Pilih Karyawan Penerima ({selectedEmployeeIds.length} Terpilih):
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedEmployeeIds(
                            selectedEmployeeIds.length === employees.length
                              ? []
                              : employees.map((e) => e.id),
                          )
                        }
                        className="text-xs text-navy-800 hover:underline font-semibold cursor-pointer"
                      >
                        {selectedEmployeeIds.length === employees.length
                          ? "Batal Pilih Semua"
                          : "Pilih Semua Karyawan"}
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-lg p-2 bg-white">
                      {employees.map((emp) => (
                        <label
                          key={emp.id}
                          className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={selectedEmployeeIds.includes(emp.id)}
                            onChange={() => toggleEmployeeSelection(emp.id)}
                            className="rounded border-slate-300 text-navy-900 focus:ring-navy-600"
                          />
                          <span className="font-medium text-slate-900">
                            {emp.fullName}
                          </span>
                          <span className="text-slate-600">({emp.workEmail})</span>
                          {emp.departmentName && (
                            <span className="ml-auto text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {emp.departmentName}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* MANAGER ONLY VIEW: LOCKED TO TEAM */
              <div className="p-4 bg-gradient-to-r from-navy-900/5 to-slate-100 rounded-xl border border-navy-100 flex items-start gap-3">
                <Building2 className="w-5 h-5 text-navy-800 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs text-slate-900">
                    Target Otomatis: Anggota Tim Bawahan Anda ({teamMembers.length} Orang)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Sebagai Manajer/Lead, email pengumuman Anda akan ditujukan langsung ke anggota tim yang berada di bawah supervisi Anda.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {teamMembers.map((member) => (
                      <span
                        key={member.id}
                        className="inline-flex items-center gap-1 text-xs bg-white text-slate-800 border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs"
                      >
                        <span className="font-medium">{member.fullName}</span>
                        {member.positionTitle && (
                          <span className="text-slate-500">
                            • {member.positionTitle}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* RECIPIENT COUNT BADGE */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-200">
                <Info className="w-4 h-4 text-navy-700 shrink-0" />
                <span>
                  Total penerima: <strong>{recipientSummary.count} orang</strong> (
                  {recipientSummary.label})
                </span>
              </div>

              {/* Peringatan Kuota Harian SMTP jika penerima melebihi batas */}
              {recipientSummary.count >
                (process.env.NEXT_PUBLIC_BROADCAST_DAILY_LIMIT
                  ? parseInt(process.env.NEXT_PUBLIC_BROADCAST_DAILY_LIMIT, 10)
                  : 400) && (
                <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50 p-3 rounded-lg border border-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Peringatan Kuota SMTP:</strong> Jumlah sasaran penerima (
                    {recipientSummary.count} orang) mendekati atau melampaui batas harian
                    server email. Pastikan akun SMTP pengirim memiliki kuota harian yang cukup
                    untuk menghindari penundaan atau pemblokiran sementara.
                  </span>
                </div>
              )}

              {recipientSummary.skipped > 0 && (
                <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {recipientSummary.skipped} orang dilewati (pengirim sendiri atau tidak
                    punya email valid).
                  </span>
                </div>
              )}

              {recipientSummary.count > 0 && (
                <details className="text-xs text-slate-600 bg-white rounded-lg border border-slate-200 px-3 py-2">
                  <summary className="cursor-pointer font-medium text-navy-800">
                    Lihat daftar penerima
                  </summary>
                  <ul className="mt-2 max-h-40 overflow-y-auto space-y-0.5 columns-1 sm:columns-2">
                    {recipientSummary.list.map((p) => (
                      <li key={p.id}>
                        {p.fullName}{" "}
                        <span className="text-slate-500">({p.workEmail})</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>

          {/* SECTION 2: IDENTITAS PENGIRIM & BALASAN */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-navy-800" />
                <h3 className="font-semibold text-sm text-slate-900">
                  2. Identitas Pengirim &amp; Alamat Balasan
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Audit: {senderCtx.userName}</span>
              </div>
            </div>

            {/* COLLAPSED 1-ROW SUMMARY */}
            {!senderExpanded ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 gap-2">
                <div className="flex items-center gap-2.5">
                  <Landmark className="w-4 h-4 text-navy-800 shrink-0" />
                  <div className="text-xs">
                    <span className="text-slate-500">Dikirim sebagai: </span>
                    <strong className="text-slate-900">{previewSender.displayName}</strong>
                    <span className="text-slate-300 mx-1.5">•</span>
                    <span className="text-slate-600">
                      {getReplyToDisplayLabel(replyToMode, customReplyToEmail)}
                    </span>
                  </div>
                </div>
                {canSendAll ? (
                  <button
                    type="button"
                    onClick={() => setSenderExpanded(true)}
                    className="text-xs font-semibold text-navy-800 hover:text-navy-900 hover:underline cursor-pointer self-start sm:self-auto"
                  >
                    Ubah Identitas / Balasan
                  </button>
                ) : (
                  <span className="text-xs bg-slate-200/70 text-slate-700 px-2.5 py-0.5 rounded-full font-medium self-start sm:self-auto">
                    Pengirim Terkunci
                  </span>
                )}
              </div>
            ) : (
              /* EXPANDED SENDER PERSONA & REPLY-TO CONTROLS */
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* PILIHAN PERSONA PENGIRIM */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Kirim Pengumuman Sebagai:
                    </label>
                    <button
                      type="button"
                      onClick={() => setSenderExpanded(false)}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                    >
                      Tutup Pengaturan Pengirim
                    </button>
                  </div>

                  {canSendAll ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* 1. LEMBAGA (ORGANIZATION) */}
                      <button
                        type="button"
                        onClick={() => {
                          setSenderPersona("ORGANIZATION");
                          setReplyToMode("NO_REPLY");
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          senderPersona === "ORGANIZATION"
                            ? "border-navy-900 bg-navy-50/50 ring-2 ring-navy-200 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Landmark className="w-4 h-4 text-navy-800" />
                            <span className="font-semibold text-xs text-slate-900">
                              Atas Nama Lembaga (PSPK)
                            </span>
                          </div>
                          {senderPersona === "ORGANIZATION" && (
                            <Check className="w-4 h-4 text-navy-900" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          Pusat Studi Pendidikan dan Kebijakan (PSPK) &bull; Pengumuman Resmi Institusi
                        </p>
                      </button>

                      {/* 2. TIM HR (HR_TEAM) */}
                      <button
                        type="button"
                        onClick={() => {
                          setSenderPersona("HR_TEAM");
                          setReplyToMode("ORGANIZATION_HR");
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          senderPersona === "HR_TEAM"
                            ? "border-navy-900 bg-navy-50/50 ring-2 ring-navy-200 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-navy-800" />
                            <span className="font-semibold text-xs text-slate-900">
                              Tim People &amp; Culture (HR)
                            </span>
                          </div>
                          {senderPersona === "HR_TEAM" && (
                            <Check className="w-4 h-4 text-navy-900" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          Tim People &amp; Culture (HR) PSPK &bull; Kepegawaian &amp; Operasional
                        </p>
                      </button>

                      {/* 3. PRIBADI (PERSONAL) */}
                      <button
                        type="button"
                        onClick={() => {
                          setSenderPersona("PERSONAL");
                          setReplyToMode("SENDER_PERSONAL");
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          senderPersona === "PERSONAL"
                            ? "border-navy-900 bg-navy-50/50 ring-2 ring-navy-200 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-navy-800" />
                            <span className="font-semibold text-xs text-slate-900">
                              Nama Pribadi ({senderCtx.userName})
                            </span>
                          </div>
                          {senderPersona === "PERSONAL" && (
                            <Check className="w-4 h-4 text-navy-900" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          {senderCtx.userName} &bull; {senderCtx.employeeTitle}
                        </p>
                      </button>

                      {/* 4. KUSTOM (CUSTOM) */}
                      <button
                        type="button"
                        onClick={() => {
                          setSenderPersona("CUSTOM");
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          senderPersona === "CUSTOM"
                            ? "border-navy-900 bg-navy-50/50 ring-2 ring-navy-200 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-gold-500" />
                            <span className="font-semibold text-xs text-slate-900">
                              Nama Pengirim Kustom
                            </span>
                          </div>
                          {senderPersona === "CUSTOM" && (
                            <Check className="w-4 h-4 text-navy-900" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          Tuliskan nama khusus (misal: Panitia Raker 2026, Satgas Internal)
                        </p>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <User className="w-4 h-4 text-navy-800" />
                        <div>
                          <span className="font-semibold text-slate-900">{senderCtx.userName}</span>
                          <span className="text-slate-600 text-xs block">
                            {senderCtx.employeeTitle} (Pengumuman Internal Tim)
                          </span>
                        </div>
                      </div>
                      <span className="text-xs bg-slate-200/70 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                        Pengirim Terkunci
                      </span>
                    </div>
                  )}

                  {/* Input Tambahan Jika Memilih Kustom */}
                  {senderPersona === "CUSTOM" && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 animate-in fade-in duration-150">
                      <label className="block text-xs font-semibold text-slate-800">
                        Nama Tampilan Pengirim Kustom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customSenderName}
                        onChange={(e) => setCustomSenderName(e.target.value)}
                        placeholder="Contoh: Panitia Rapat Kerja PSPK 2026"
                        maxLength={100}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent text-slate-900"
                      />
                    </div>
                  )}
                </div>

                {/* PENGATURAN BALASAN (REPLY-TO) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Reply className="w-3.5 h-3.5 text-navy-800" />
                    <span>Tujuan Balasan Email (Reply-To):</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <label
                      className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer text-xs transition-colors ${
                        replyToMode === "NO_REPLY"
                          ? "border-navy-900 bg-navy-50/40 text-navy-900 font-semibold"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="replyToMode"
                        value="NO_REPLY"
                        checked={replyToMode === "NO_REPLY"}
                        onChange={() => setReplyToMode("NO_REPLY")}
                        className="text-navy-900 focus:ring-navy-600"
                      />
                      <div>
                        <span className="block text-xs">Satu Arah (No-Reply)</span>
                        <span className="text-xs text-slate-500 font-normal">no-reply@pspk.id</span>
                      </div>
                    </label>

                    {canSendAll && (
                      <label
                        className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer text-xs transition-colors ${
                          replyToMode === "ORGANIZATION_HR"
                            ? "border-navy-900 bg-navy-50/40 text-navy-900 font-semibold"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="replyToMode"
                          value="ORGANIZATION_HR"
                          checked={replyToMode === "ORGANIZATION_HR"}
                          onChange={() => setReplyToMode("ORGANIZATION_HR")}
                          className="text-navy-900 focus:ring-navy-600"
                        />
                        <div>
                          <span className="block text-xs">Email Tim HR</span>
                          <span className="text-xs text-slate-500 font-normal">hr@pspk.id</span>
                        </div>
                      </label>
                    )}

                    <label
                      className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer text-xs transition-colors ${
                        replyToMode === "SENDER_PERSONAL"
                          ? "border-navy-900 bg-navy-50/40 text-navy-900 font-semibold"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="replyToMode"
                        value="SENDER_PERSONAL"
                        checked={replyToMode === "SENDER_PERSONAL"}
                        onChange={() => setReplyToMode("SENDER_PERSONAL")}
                        className="text-navy-900 focus:ring-navy-600"
                      />
                      <div>
                        <span className="block text-xs">Email Pribadi Saya</span>
                        <span className="text-xs text-slate-500 font-normal truncate max-w-[140px] block" title={senderCtx.userEmail}>
                          {senderCtx.userEmail}
                        </span>
                      </div>
                    </label>

                    {canSendAll && (
                      <label
                        className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer text-xs transition-colors ${
                          replyToMode === "CUSTOM"
                            ? "border-navy-900 bg-navy-50/40 text-navy-900 font-semibold"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="replyToMode"
                          value="CUSTOM"
                          checked={replyToMode === "CUSTOM"}
                          onChange={() => setReplyToMode("CUSTOM")}
                          className="text-navy-900 focus:ring-navy-600"
                        />
                        <div>
                          <span className="block text-xs">Email Kustom</span>
                          <span className="text-xs text-slate-500 font-normal">Tentukan alamat spesifik</span>
                        </div>
                      </label>
                    )}
                  </div>

                  {replyToMode === "CUSTOM" && (
                    <div className="pt-2 animate-in fade-in duration-150">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Alamat Email Balasan Khusus (Reply-To):
                      </label>
                      <input
                        type="email"
                        value={customReplyToEmail}
                        onChange={(e) => setCustomReplyToEmail(e.target.value)}
                        placeholder="misal: panitia.acara@pspk.id atau project@pspk.id"
                        className="w-full sm:w-80 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-navy-800 focus:ring-1 focus:ring-navy-800 transition-colors"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: SUBJEK & KONTEN PESAN */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-navy-800" />
                <h3 className="font-semibold text-sm text-slate-900">
                  3. Subjek &amp; Naskah Pengumuman
                </h3>
              </div>

              {/* TAB SELECTOR: WRITE vs LIVE PREVIEW (Hanya tampil di mobile / tablet < lg) */}
              <div className="lg:hidden flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab("write")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    activeTab === "write"
                      ? "bg-white text-navy-900 font-semibold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Tulis Pesan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    activeTab === "preview"
                      ? "bg-white text-navy-900 font-semibold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Pratinjau Email</span>
                </button>
              </div>
            </div>

            {/* SUBJEK INPUT */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Subjek Email Pengumuman <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-500">
                  {subject.length}/200 karakter
                </span>
              </div>
              <input
                type="text"
                required
                minLength={3}
                maxLength={200}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Contoh: [Pemberitahuan] Penyesuaian Jadwal Rapat Koordinasi Tim Riset"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent font-medium"
              />
              <p className="mt-1 text-xs text-slate-500">
                Di inbox penerima, subjek tampil sebagai:{" "}
                <span className="font-medium text-slate-700">
                  [PSPK HRIS] {subject || "…"}
                </span>
              </p>
            </div>

            {/* RESPONSIVE LAYOUT FOR EDITOR & PREVIEW */}
            {/* Pada layar lg+: 2 Kolom berdampingan. Kiri: Editor, Kanan: Live Preview Sticky */}
            {/* Pada layar < lg: Tab Tulis vs Pratinjau bergantian */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* LEFT COLUMN: TIPTAP EDITOR */}
              <div
                className={
                  activeTab === "write"
                    ? "block space-y-1.5"
                    : "hidden lg:block space-y-1.5"
                }
              >
                <label className="block text-xs font-semibold text-slate-700">
                  Isi Pengumuman (Gunakan toolbar untuk format teks, link &amp; gambar):
                </label>
                <RichTextEditor
                  value={contentHtml}
                  onChange={setContentHtml}
                  placeholder="Tuliskan isi pengumuman atau instruksi resmi di sini..."
                />
              </div>

              {/* RIGHT COLUMN: LIVE EMAIL PREVIEW */}
              <div
                className={
                  activeTab === "preview"
                    ? "block space-y-2"
                    : "hidden lg:block space-y-2 lg:sticky lg:top-4 max-h-[calc(100vh-2rem)] overflow-y-auto"
                }
              >
                <div className="hidden lg:flex items-center justify-between text-xs text-slate-700 font-semibold px-1">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-navy-800" />
                    <span>Pratinjau Langsung (Live Email Preview)</span>
                  </div>
                  <span className="text-slate-500 font-normal">
                    Format email penerima
                  </span>
                </div>
                <BroadcastEmailPreview
                  subject={subject}
                  contentHtml={contentHtml}
                  targetScope={targetScope}
                  previewSender={previewSender}
                  recipientCount={recipientSummary.count}
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: OPSI PENGIRIMAN & DUAL NOTIFIKASI */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Bell className="w-4 h-4 text-navy-800" />
              <h3 className="font-semibold text-sm text-slate-900">
                4. Opsi Pengiriman Tambahan
              </h3>
            </div>

            <label className="flex items-start gap-3 p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={sendInApp}
                onChange={(e) => setSendInApp(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-navy-900 focus:ring-navy-600"
              />
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Kirimkan juga sebagai Notifikasi In-App di Portal HRIS
                </span>
                <span className="text-xs text-slate-600 mt-0.5 block leading-relaxed">
                  Penerima akan melihat badge merah pada lonceng notifikasi di pojok kanan atas aplikasi portal HRIS selain menerima email di inbox masing-masing.
                </span>
              </div>
            </label>
          </div>
        </fieldset>

        {/* STICKY BOTTOM ACTION BAR */}
        <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 -mb-6 bg-white/95 backdrop-blur-xs border-t border-slate-200 py-3 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2 text-xs text-slate-600 w-full sm:w-auto">
            <span className="font-medium text-slate-900">Ke:</span>
            <span className="font-semibold text-navy-900">{recipientSummary.count} orang</span>
            <span className="text-slate-300">•</span>
            <span className="font-medium text-slate-900">Dari:</span>
            <span
              className="font-semibold text-slate-900 truncate max-w-[200px]"
              title={previewSender.displayName}
            >
              {previewSender.displayName}
            </span>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <Link
              href="/komunikasi/riwayat"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline"
            >
              ← Riwayat Pengumuman
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isManagerEmpty}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#102E50] hover:bg-[#0c233d] text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-gold-400" />
              <span>Kirim Pengumuman</span>
            </button>
          </div>
        </div>
      </form>

      {/* CONFIRMATION SAFETY MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="p-6 bg-[#102E50] text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#1b3c63] rounded-lg">
                  <Send className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Konfirmasi Pengiriman Broadcast</h3>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Harap tinjau ringkasan pengiriman sebelum email disebarkan
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* DETAILS SUMMARY */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Subjek:</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {subject}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Identitas Pengirim Resmi:</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {previewSender.displayName} ({previewSender.displayTitle})
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Akun Pengirim Teknis:</span>
                  <span className="font-mono font-medium text-[#102E50]">
                    PSPK HRIS &lt;no-reply@pspk.id&gt;
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Alamat Balasan (*Reply-To*):</span>
                  <span className="font-semibold text-slate-900">
                    {previewSender.replyToMode === "NO_REPLY"
                      ? "Satu Arah (Tidak Menerima Balasan)"
                      : previewSender.replyToEmail}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Target Cakupan:</span>
                  <span className="font-semibold text-slate-900">
                    {recipientSummary.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Penerima:</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {recipientSummary.count} Orang Karyawan
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-slate-500 block mb-1">Penerima:</span>
                  <p className="text-slate-800 leading-relaxed max-h-24 overflow-y-auto">
                    {recipientSummary.list.map((p) => p.fullName).join(", ")}
                  </p>
                </div>
              </div>

              {/* CUPLIKAN NASKAH & GAMBAR */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>Cuplikan Naskah:</span>
                  {imageCount > 0 && (
                    <span className="text-navy-900 font-semibold bg-navy-50 border border-navy-200 px-2 py-0.5 rounded text-xs">
                      {imageCount} gambar tersemat
                    </span>
                  )}
                </div>
                <p className="text-slate-800 italic leading-relaxed line-clamp-3">
                  &ldquo;{snippet || "(Tidak ada naskah teks polos)"}&rdquo;
                </p>
              </div>

              {/* PERINGATAN UMUM / MASSAL */}
              {isBulk ? (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="font-semibold text-xs block text-amber-900">
                        Perhatian Pengiriman Massal ({recipientSummary.count} Penerima)
                      </strong>
                      <p className="text-xs leading-relaxed text-amber-800">
                        Pengumuman ini ditujukan ke khalayak luas. Pastikan subjek, tata bahasa, dan lampiran sudah benar karena email yang terkirim tidak dapat ditarik kembali.
                      </p>
                    </div>
                  </div>

                  {/* CHECKBOX PERSETUJUAN */}
                  <label className="flex items-start gap-2.5 p-2.5 bg-white/80 rounded-lg border border-amber-200 cursor-pointer text-xs text-amber-950 font-medium">
                    <input
                      type="checkbox"
                      checked={confirmAgreed}
                      onChange={(e) => setConfirmAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-amber-400 text-navy-900 focus:ring-navy-600 cursor-pointer"
                    />
                    <span>
                      Saya telah memeriksa isi pengumuman dan memastikan daftar penerima sudah sesuai.
                    </span>
                  </label>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Perhatian:</strong> Email akan segera dikirimkan ke kotak masuk masing-masing penerima secara terpisah. Tindakan pengiriman ini tidak dapat dibatalkan atau ditarik kembali.
                  </span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                Kembali &amp; Periksa
              </button>

              <button
                type="button"
                disabled={isSubmitting || (isBulk && !confirmAgreed)}
                onClick={handleExecuteSend}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#102E50] hover:bg-[#0c233d] text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
                    <span>Sedang Mengirim Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-gold-400" />
                    <span>Ya, Kirim Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
