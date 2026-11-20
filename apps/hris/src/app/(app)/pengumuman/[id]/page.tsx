import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import {
  Mail,
  Calendar,
  User,
  Paperclip,
  FileText,
  Download,
  ArrowLeft,
  ShieldAlert,
  Tag,
  Reply,
} from "lucide-react";
import { getSession, getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import { prisma } from "@pspk/db";
import {
  BROADCAST_CATEGORY_LABELS,
  BroadcastCategory,
} from "../../../../server/schemas/broadcast.schema";
import { markBroadcastAsRead } from "../../../../server/services/broadcast-email.service";
import { BroadcastReadConfirmation } from "../../../../components/broadcast/broadcast-read-confirmation";

export const dynamic = "force-dynamic";

interface PengumumanDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PengumumanDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const broadcast = await prisma.emailBroadcast.findUnique({
    where: { id },
    select: { subject: true },
  });

  if (!broadcast) {
    return { title: "Pengumuman Tidak Ditemukan" };
  }

  return {
    title: `${broadcast.subject} — Pengumuman Resmi PSPK`,
  };
}

export default async function PengumumanDetailPage({
  params,
}: PengumumanDetailPageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    redirect("/login");
  }

  const { id: broadcastId } = await params;
  if (!broadcastId) {
    notFound();
  }

  const broadcast = await prisma.emailBroadcast.findUnique({
    where: { id: broadcastId },
    include: {
      attachments: {
        orderBy: { createdAt: "asc" },
      },
      recipients: {
        include: {
          employee: {
            select: { id: true, userId: true, workEmail: true },
          },
        },
      },
    },
  });

  if (!broadcast) {
    notFound();
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    redirect("/login");
  }

  const isSuperAdmin = authCtx.roles.includes("super_admin");
  const isAdminHr = authCtx.roles.includes("admin_hr");
  const canSendAll = isSuperAdmin || isAdminHr || can(authCtx, "hris.broadcast.send:all");
  const isAuthor = broadcast.senderUserId === session.user.id;

  // Cek apakah user yang sedang masuk adalah salah satu recipient
  const userEmployee = await prisma.employee.findFirst({
    where: { userId: session.user.id },
    select: { id: true, workEmail: true },
  });

  const recipientRecord = broadcast.recipients.find(
    (r) =>
      (userEmployee && r.employeeId === userEmployee.id) ||
      (r.employee?.userId === session.user.id) ||
      (userEmployee?.workEmail && r.email.toLowerCase() === userEmployee.workEmail.toLowerCase()) ||
      (session.user.email && r.email.toLowerCase() === session.user.email.toLowerCase()),
  );

  const isRecipient = Boolean(recipientRecord);

  // Akses ditolak jika bukan author, bukan pemegang hak send:all, dan bukan recipient
  if (!isAuthor && !canSendAll && !isRecipient) {
    redirect("/forbidden");
  }

  // Idempoten: Jika penerima membuka pengumuman yang TIDAK mewajibkan tombol konfirmasi klik,
  // otomatis catat readAt pada saat membuka halaman (jika belum tercatat).
  let currentReadAt = recipientRecord?.readAt || null;
  if (isRecipient && !broadcast.requireReadReceipt && !currentReadAt) {
    try {
      const markRes = await markBroadcastAsRead(session.user.id, broadcast.id);
      currentReadAt = markRes.readAt;
    } catch (err) {
      console.error("Gagal mencatat otomatis read receipt:", err);
    }
  }

  const categoryLabel =
    broadcast.category && broadcast.category in BROADCAST_CATEGORY_LABELS
      ? BROADCAST_CATEGORY_LABELS[broadcast.category as BroadcastCategory]
      : broadcast.category || null;

  const isImportant = broadcast.priority === "PENTING";

  const scopeLabel =
    broadcast.targetScope === "ALL_EMPLOYEES"
      ? "Seluruh Karyawan"
      : broadcast.targetScope === "DEPARTMENT"
        ? "Divisi / Departemen"
        : broadcast.targetScope === "CUSTOM"
          ? "Pegawai Terpilih"
          : "Tim";

  const formattedDate = new Date(broadcast.createdAt).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const backUrl =
    isAuthor || canSendAll
      ? "/komunikasi/riwayat"
      : "/notifikasi";

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <Link
              href={backUrl}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-navy-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke {isAuthor || canSendAll ? "Riwayat Pengumuman" : "Daftar Notifikasi"}</span>
            </Link>

            <span className="text-xs text-slate-500 font-mono">
              ID: {broadcast.id.slice(0, 8)}
            </span>
          </div>

          {/* BADGES */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
              <Mail className="w-3 h-3" />
              <span>{scopeLabel}</span>
            </span>

            {isImportant && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>PENTING</span>
              </span>
            )}

            {categoryLabel && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                <Tag className="w-3 h-3 text-slate-500" />
                <span>{categoryLabel}</span>
              </span>
            )}
          </div>

          {/* SUBJECT HEADING */}
          <h1 className="text-xl sm:text-2xl font-bold text-[#102E50] leading-snug">
            {broadcast.subject}
          </h1>

          {/* METADATA BAR */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
                <User className="w-3.5 h-3.5 text-navy-800" />
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">
                  {broadcast.senderName}
                </span>
                <span className="text-slate-500 text-xs">
                  {broadcast.senderDisplayTitle || "Pengirim Resmi PSPK"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Diterbitkan: {formattedDate} WIB</span>
            </div>

            {broadcast.replyToMode !== "NO_REPLY" && broadcast.replyToEmail && (
              <div className="flex items-center gap-1.5 text-slate-600 font-mono text-xs">
                <Reply className="w-3.5 h-3.5 text-slate-400" />
                <span>Balasan: {broadcast.replyToEmail}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT BODY */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* READ RECEIPT CONFIRMATION BANNER (JIKA DIMINTA & USER ADALAH RECIPIENT) */}
        {isRecipient && broadcast.requireReadReceipt && (
          <BroadcastReadConfirmation
            broadcastId={broadcast.id}
            initialReadAt={currentReadAt}
          />
        )}

        {/* MAIN DOCUMENT CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
          <div
            className="text-sm text-slate-800 leading-relaxed space-y-4 tiptap-editor overflow-hidden break-words"
            dangerouslySetInnerHTML={{ __html: broadcast.contentHtml }}
          />

          {/* LAMPIRAN DOKUMEN PDF */}
          {broadcast.attachments && broadcast.attachments.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-3">
                <Paperclip className="w-4 h-4 text-navy-800" />
                <span>Lampiran Dokumen PDF ({broadcast.attachments.length} berkas)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {broadcast.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={`/api/documents/${att.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="p-2.5 bg-red-50 text-red-600 rounded-lg shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 group-hover:text-navy-900 truncate block">
                          {att.fileName}
                        </span>
                        <span className="text-slate-500 text-xs block mt-0.5">
                          {(att.sizeBytes / (1024 * 1024)).toFixed(2)} MB &bull; PDF
                        </span>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-navy-900 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER NOTICE */}
        <div className="text-center text-xs text-slate-500">
          <p>
            Pengumuman ini diterbitkan secara sah dan tersimpan pada arsip resmi Sistem HRIS PSPK.
          </p>
        </div>
      </div>
    </div>
  );
}
