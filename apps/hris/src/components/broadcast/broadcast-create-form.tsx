"use client";

import React, { useState, useEffect } from "react";
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
  Bookmark,
  FileText,
  Paperclip,
  Trash2,
  UploadCloud,
  Clock,
  Calendar,
} from "lucide-react";
import { RichTextEditor } from "./rich-text-editor";
import { BroadcastEmailPreview } from "./broadcast-email-preview";
import { RecipientPicker } from "./recipient-picker";
import {
  BroadcastDraftTemplateDrawer,
  SaveDraftModal,
  SaveTemplateModal,
} from "./broadcast-draft-template-drawer";
import {
  getReplyToDisplayLabel,
  isBulkBroadcast,
  extractContentSummary,
} from "./broadcast-form-utils";
import {
  sendBroadcastAction,
  sendTestBroadcastAction,
  deleteBroadcastAttachmentAction,
  BroadcastFormData,
} from "../../server/actions/broadcast.actions";
import {
  saveBroadcastDraftAction,
  listBroadcastDraftsAction,
  deleteBroadcastDraftAction,
  saveBroadcastTemplateAction,
  listBroadcastTemplatesAction,
  deleteBroadcastTemplateAction,
} from "../../server/actions/broadcast-draft.actions";
import {
  SenderPersona,
  ReplyToMode,
  resolveSenderIdentity,
  hasDeliverableEmail,
  BroadcastDraftItem,
  BroadcastTemplateItem,
  BroadcastAttachmentItem,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_ATTACHMENTS_COUNT,
  MAX_TOTAL_ATTACHMENT_SIZE_BYTES,
} from "../../server/schemas/broadcast.schema";

function toDateTimeLocalString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatScheduledWib(date: Date): string {
  try {
    return (
      new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date) + " WIB"
    );
  } catch {
    return date.toLocaleString("id-ID") + " WIB";
  }
}

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

  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>(
    departments[0]?.id ? [departments[0].id] : [],
  );
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [excludedEmployeeIds, setExcludedEmployeeIds] = useState<string[]>([]);

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

  // Jadwal Pengiriman State
  const [deliveryTimeMode, setDeliveryTimeMode] = useState<"NOW" | "SCHEDULED">("NOW");
  const [scheduledDateString, setScheduledDateString] = useState("");

  // Active view tab for mobile / tablet (< lg): write vs preview
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  // Confirmation modal & submission state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAgreed, setConfirmAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    broadcastId?: string;
  } | null>(null);

  // Draf & Template State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);
  const [drafts, setDrafts] = useState<BroadcastDraftItem[]>([]);
  const [templates, setTemplates] = useState<BroadcastTemplateItem[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [lastAutosavedAt, setLastAutosavedAt] = useState<Date | null>(null);
  const [isSaveDraftModalOpen, setIsSaveDraftModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Lampiran PDF State
  const [attachments, setAttachments] = useState<BroadcastAttachmentItem[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const totalAttachmentSize = attachments.reduce(
    (sum, a) => sum + a.sizeBytes,
    0,
  );

  // Inisialisasi daftar draf dan template saat komponen dimuat
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsDrawerLoading(true);
      try {
        const [dRes, tRes] = await Promise.all([
          listBroadcastDraftsAction(),
          listBroadcastTemplatesAction(),
        ]);
        if (isMounted) {
          if (dRes.success && dRes.data) setDrafts(dRes.data);
          if (tRes.success && tRes.data) setTemplates(tRes.data);
        }
      } catch (err) {
        console.error("Gagal memuat draf dan template:", err);
      } finally {
        if (isMounted) setIsDrawerLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Autosave 3 detik hanya jika ada activeDraftId
  useEffect(() => {
    if (!activeDraftId) return;

    const timer = setTimeout(async () => {
      try {
        const res = await saveBroadcastDraftAction({
          id: activeDraftId,
          subject,
          contentHtml,
          targetScope,
          targetDepartmentIds: selectedDepartmentIds,
          customEmployeeIds: selectedEmployeeIds,
          excludedEmployeeIds,
          senderPersona,
          customSenderName: customSenderName.trim() || undefined,
          replyToMode,
          customReplyToEmail: customReplyToEmail.trim() || undefined,
          sendInApp,
          scheduledAt:
            deliveryTimeMode === "SCHEDULED" && scheduledDateString
              ? new Date(scheduledDateString)
              : null,
          attachmentIds: attachments.map((a) => a.id),
        });

        if (res.success && res.data) {
          setLastAutosavedAt(new Date());
          setDrafts((prev) =>
            prev.map((d) => (d.id === activeDraftId ? res.data! : d)),
          );
        }
      } catch (err) {
        console.error("Gagal melakukan autosave draf:", err);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [
    activeDraftId,
    subject,
    contentHtml,
    targetScope,
    selectedDepartmentIds,
    selectedEmployeeIds,
    excludedEmployeeIds,
    senderPersona,
    customSenderName,
    replyToMode,
    customReplyToEmail,
    sendInApp,
    deliveryTimeMode,
    scheduledDateString,
    attachments,
  ]);

  const handleSaveDraft = async (customTitle?: string) => {
    setIsSavingDraft(true);
    try {
      const res = await saveBroadcastDraftAction({
        id: activeDraftId || undefined,
        title: customTitle,
        subject,
        contentHtml,
        targetScope,
        targetDepartmentIds: selectedDepartmentIds,
        customEmployeeIds: selectedEmployeeIds,
        excludedEmployeeIds,
        senderPersona,
        customSenderName: customSenderName.trim() || undefined,
        replyToMode,
        customReplyToEmail: customReplyToEmail.trim() || undefined,
        sendInApp,
        scheduledAt:
          deliveryTimeMode === "SCHEDULED" && scheduledDateString
            ? new Date(scheduledDateString)
            : null,
        attachmentIds: attachments.map((a) => a.id),
      });

      if (res.success && res.data) {
        setActiveDraftId(res.data.id);
        setDrafts((prev) => {
          const exists = prev.some((d) => d.id === res.data!.id);
          return exists
            ? prev.map((d) => (d.id === res.data!.id ? res.data! : d))
            : [res.data!, ...prev];
        });
        setFeedback({
          type: "success",
          message: `Draf "${res.data.title || "Pengumuman"}" berhasil disimpan.`,
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Gagal menyimpan draf.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Terjadi kesalahan saat menyimpan draf.",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSaveTemplate = async (data: {
    name: string;
    category?: string;
    isShared: boolean;
  }) => {
    setIsSavingTemplate(true);
    try {
      const res = await saveBroadcastTemplateAction({
        name: data.name,
        category: data.category,
        subject: subject.trim() || "Pengumuman",
        contentHtml: contentHtml || "<p></p>",
        isShared: data.isShared,
      });

      if (res.success && res.data) {
        setTemplates((prev) => [res.data!, ...prev]);
        setFeedback({
          type: "success",
          message: `Template "${res.data.name}" berhasil disimpan.`,
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Gagal menyimpan template.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Terjadi kesalahan saat menyimpan template.",
      });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleLoadDraft = (draft: BroadcastDraftItem) => {
    setActiveDraftId(draft.id);
    setSubject(draft.subject);
    setContentHtml(draft.contentHtml);
    setTargetScope(draft.targetScope);
    setSelectedDepartmentIds(draft.targetDepartmentIds || []);
    setSenderPersona(draft.senderPersona);
    setCustomSenderName(draft.customSenderName || "");
    setReplyToMode(draft.replyToMode);
    setCustomReplyToEmail(draft.customReplyToEmail || "");
    setSendInApp(draft.sendInApp);
    setAttachments(draft.attachments || []);

    if (draft.scheduledAt) {
      setDeliveryTimeMode("SCHEDULED");
      setScheduledDateString(toDateTimeLocalString(new Date(draft.scheduledAt)));
    } else {
      setDeliveryTimeMode("NOW");
      setScheduledDateString("");
    }

    // Filter staf yang sudah tidak aktif
    const activeEmpIds = new Set(employees.map((e) => e.id));
    const validCustomIds = (draft.customEmployeeIds || []).filter((id) =>
      activeEmpIds.has(id),
    );
    const validExcludedIds = (draft.excludedEmployeeIds || []).filter(
      (id) => activeEmpIds.has(id) || teamMembers.some((t) => t.id === id),
    );

    const droppedCustom = (draft.customEmployeeIds || []).length - validCustomIds.length;
    const droppedExcluded = (draft.excludedEmployeeIds || []).length - validExcludedIds.length;

    setSelectedEmployeeIds(validCustomIds);
    setExcludedEmployeeIds(validExcludedIds);

    if (droppedCustom > 0 || droppedExcluded > 0) {
      setFeedback({
        type: "error",
        message: `Draf dimuat: ${droppedCustom + droppedExcluded} penerima/pengecualian telah dihapus dari draf karena data karyawan sudah tidak aktif.`,
      });
    } else {
      setFeedback({
        type: "success",
        message: `Draf "${draft.title || draft.subject || "Pengumuman"}" berhasil dimuat ke editor.`,
      });
    }
  };

  const handleLoadTemplate = (template: BroadcastTemplateItem) => {
    if (subject.trim() || (contentHtml.trim() && contentHtml !== "<p></p>")) {
      if (
        !confirm(
          `Ganti subjek dan isi pesan saat ini dengan template "${template.name}"? Naskah yang sedang ditulis akan digantikan.`,
        )
      ) {
        return;
      }
    }

    setSubject(template.subject);
    setContentHtml(template.contentHtml);
    setFeedback({
      type: "success",
      message: `Template "${template.name}" berhasil diterapkan ke formulir.`,
    });
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      const res = await deleteBroadcastDraftAction(draftId);
      if (res.success) {
        if (draftId === activeDraftId) {
          setActiveDraftId(null);
        }
        setDrafts((prev) => prev.filter((d) => d.id !== draftId));
      } else {
        alert(res.error || "Gagal menghapus draf.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat menghapus draf.");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const res = await deleteBroadcastTemplateAction(templateId);
      if (res.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      } else {
        alert(res.error || "Gagal menghapus template.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat menghapus template.");
    }
  };

  const handleUploadAttachment = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setAttachmentError(null);
    const fileList = Array.from(files);

    if (attachments.length + fileList.length > MAX_ATTACHMENTS_COUNT) {
      setAttachmentError(`Maksimal ${MAX_ATTACHMENTS_COUNT} berkas lampiran PDF.`);
      if (e.target) e.target.value = "";
      return;
    }

    const currentTotalSize = attachments.reduce(
      (sum, a) => sum + a.sizeBytes,
      0,
    );
    const newFilesTotalSize = fileList.reduce((sum, f) => sum + f.size, 0);

    if (currentTotalSize + newFilesTotalSize > MAX_TOTAL_ATTACHMENT_SIZE_BYTES) {
      setAttachmentError(
        `Total ukuran seluruh lampiran tidak boleh melebihi 10 MB (total saat ini akan menjadi ${(
          (currentTotalSize + newFilesTotalSize) /
          (1024 * 1024)
        ).toFixed(1)} MB).`,
      );
      if (e.target) e.target.value = "";
      return;
    }

    for (const f of fileList) {
      if (
        f.type !== "application/pdf" &&
        !f.name.toLowerCase().endsWith(".pdf")
      ) {
        setAttachmentError(`Berkas "${f.name}" bukan berkas PDF.`);
        if (e.target) e.target.value = "";
        return;
      }
      if (f.size > MAX_ATTACHMENT_SIZE_BYTES) {
        setAttachmentError(
          `Ukuran berkas "${f.name}" (${(f.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas 5 MB.`,
        );
        if (e.target) e.target.value = "";
        return;
      }
    }

    setIsUploadingAttachment(true);
    try {
      const uploadedItems: BroadcastAttachmentItem[] = [];
      for (const file of fileList) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/broadcast/upload-attachment", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(
            json.error || `Gagal mengunggah berkas "${file.name}".`,
          );
        }

        uploadedItems.push(json.attachment);
      }

      setAttachments((prev) => [...prev, ...uploadedItems]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal mengunggah berkas lampiran.";
      setAttachmentError(msg);
    } finally {
      setIsUploadingAttachment(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      const res = await deleteBroadcastAttachmentAction(attachmentId);
      if (res.success) {
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      } else {
        setAttachmentError(res.error || "Gagal menghapus berkas lampiran.");
      }
    } catch (err: unknown) {
      console.error("Gagal menghapus berkas lampiran:", err);
      setAttachmentError("Terjadi kesalahan saat menghapus lampiran.");
    }
  };

  // Calculate resolved sender identity dynamically for live preview and modal
  const previewSender = resolveSenderIdentity(
    senderCtx,
    senderPersona,
    customSenderName,
    replyToMode,
    customReplyToEmail,
  );

  type Person = { id: string; fullName: string; workEmail: string };

  // Aturan identik dengan server: bukan pengirim, email valid, & tidak dikecualikan
  const deliverable = (list: Person[]) =>
    list.filter(
      (p) =>
        p.id !== senderCtx.employeeId &&
        hasDeliverableEmail(p.workEmail) &&
        !excludedEmployeeIds.includes(p.id),
    );

  const getRecipientSummary = () => {
    let label = "";
    let source: Person[] = [];

    if (targetScope === "TEAM") {
      label = "Anggota Tim Anda";
      source = teamMembers;
    } else if (targetScope === "DEPARTMENT") {
      const selectedDepts = departments.filter((d) =>
        selectedDepartmentIds.includes(d.id),
      );
      if (selectedDepts.length === 1) {
        label = `Divisi ${selectedDepts[0]?.name || ""}`;
      } else if (selectedDepts.length > 1) {
        label = `${selectedDepts.length} Divisi Terpilih`;
      } else {
        label = "Belum Ada Divisi Dipilih";
      }
      source = employees.filter(
        (e) => e.departmentId && selectedDepartmentIds.includes(e.departmentId),
      );
    } else if (targetScope === "CUSTOM") {
      label = `${selectedEmployeeIds.length} Karyawan Terpilih`;
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

    if (targetScope === "DEPARTMENT" && selectedDepartmentIds.length === 0) {
      setFeedback({
        type: "error",
        message: "Harap pilih minimal 1 divisi tujuan pengumuman.",
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

    if (recipientSummary.count === 0) {
      setFeedback({
        type: "error",
        message: "Tidak ada penerima aktif yang memenuhi syarat setelah memperhitungkan filter dan pengecualian.",
      });
      return;
    }

    if (deliveryTimeMode === "SCHEDULED") {
      if (!scheduledDateString) {
        setFeedback({
          type: "error",
          message: "Harap tentukan tanggal dan waktu jadwal pengiriman pengumuman.",
        });
        return;
      }
      const schedTime = new Date(scheduledDateString).getTime();
      if (Number.isNaN(schedTime)) {
        setFeedback({
          type: "error",
          message: "Format tanggal jadwal pengiriman tidak valid.",
        });
        return;
      }
      const minAllowed = Date.now() + 5 * 60 * 1000 - 30000;
      if (schedTime < minAllowed) {
        setFeedback({
          type: "error",
          message: "Jadwal pengiriman minimal 5 menit dari waktu sekarang.",
        });
        return;
      }
      const maxAllowed = Date.now() + 90 * 24 * 60 * 60 * 1000;
      if (schedTime > maxAllowed) {
        setFeedback({
          type: "error",
          message: "Jadwal pengiriman maksimal 90 hari ke depan.",
        });
        return;
      }
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
          targetScope === "DEPARTMENT" ? selectedDepartmentIds[0] || null : undefined,
        targetDepartmentIds:
          targetScope === "DEPARTMENT" ? selectedDepartmentIds : [],
        customEmployeeIds:
          targetScope === "CUSTOM" ? selectedEmployeeIds : [],
        excludedEmployeeIds,
        sendInApp,
        scheduledAt:
          deliveryTimeMode === "SCHEDULED" && scheduledDateString
            ? new Date(scheduledDateString)
            : null,
        senderPersona,
        customSenderName: senderPersona === "CUSTOM" ? customSenderName.trim() : undefined,
        replyToMode,
        customReplyToEmail: replyToMode === "CUSTOM" ? customReplyToEmail.trim() : undefined,
        attachmentIds: attachments.map((a) => a.id),
      });

      if (res.success) {
        setShowConfirmModal(false);
        setFeedback({
          type: "success",
          message: res.message || "Pengumuman berhasil disebarkan!",
          broadcastId: res.broadcastId,
        });

        if (activeDraftId) {
          try {
            await deleteBroadcastDraftAction(activeDraftId);
            setDrafts((prev) => prev.filter((d) => d.id !== activeDraftId));
            setActiveDraftId(null);
          } catch (e) {
            console.error("Gagal membersihkan draf terkirim:", e);
          }
        }

        setSubject("");
        setContentHtml("");
        setAttachments([]);
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

  const handleSendTestEmail = async () => {
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
        message: "Subjek pengumuman minimal 3 karakter untuk mengirim email uji.",
      });
      return;
    }

    if (!contentHtml.trim() || contentHtml === "<p></p>") {
      setFeedback({
        type: "error",
        message: "Isi naskah pengumuman wajib diisi sebelum mengirim email uji.",
      });
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await sendTestBroadcastAction({
        subject,
        contentHtml,
        senderPersona,
        customSenderName: customSenderName.trim() || undefined,
        replyToMode,
        customReplyToEmail: customReplyToEmail.trim() || undefined,
        attachmentIds: attachments.map((a) => a.id),
      });

      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message || "Email uji berhasil dikirim ke kotak masuk Anda.",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Gagal mengirimkan email uji.",
        });
      }
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim email uji.",
      });
    } finally {
      setIsSendingTest(false);
    }
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

      {/* TOOLBAR ATAS: DRAF & TEMPLATE */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5 text-navy-800" />
            <span>Draf &amp; Template</span>
            {(drafts.length > 0 || templates.length > 0) && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold bg-[#102E50] text-white">
                {drafts.length + templates.length}
              </span>
            )}
          </button>

          {activeDraftId && (
            <div className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium">
                Draf Aktif:{" "}
                <strong>
                  {drafts.find((d) => d.id === activeDraftId)?.title || "Draf"}
                </strong>
              </span>
              {lastAutosavedAt && (
                <span suppressHydrationWarning className="text-emerald-700 text-xs hidden md:inline">
                  • Tersimpan otomatis{" "}
                  {lastAutosavedAt.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeDraftId && (
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    "Tutup draf aktif dan bersihkan formulir untuk memulai pengumuman baru?",
                  )
                ) {
                  setActiveDraftId(null);
                  setSubject("");
                  setContentHtml("");
                  setLastAutosavedAt(null);
                }
              }}
              className="text-xs text-slate-600 hover:text-slate-900 hover:underline font-medium cursor-pointer"
            >
              Tutup Draf (Mulai Baru)
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSaveDraftModalOpen(true)}
            disabled={isSavingDraft}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Simpan Draf</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSaveTemplateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5 text-slate-600" />
            <span>Jadikan Template</span>
          </button>
        </div>
      </div>

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
                      Spesifik untuk divisi PSPK (bisa multi-divisi)
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

            {/* RECIPIENT PICKER (Multi-divisi, Custom Search, & Pengecualian) */}
            <RecipientPicker
              targetScope={targetScope}
              departments={departments}
              employees={employees}
              teamMembers={teamMembers}
              senderEmployeeId={senderCtx.employeeId}
              selectedDepartmentIds={selectedDepartmentIds}
              onChangeDepartmentIds={setSelectedDepartmentIds}
              selectedEmployeeIds={selectedEmployeeIds}
              onChangeEmployeeIds={setSelectedEmployeeIds}
              excludedEmployeeIds={excludedEmployeeIds}
              onChangeExcludedIds={setExcludedEmployeeIds}
            />

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
                <div className="flex items-center justify-between text-xs text-slate-700 font-semibold px-1 pb-1">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-navy-800" />
                    <span>Pratinjau Langsung (Email Preview)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={isSubmitting || isSendingTest}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-navy-900 bg-navy-50 hover:bg-navy-100 border border-navy-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    title={`Kirim email uji ke ${senderCtx.userEmail}`}
                  >
                    {isSendingTest ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-navy-900" />
                        <span>Mengirim Uji...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3 h-3 text-navy-900" />
                        <span>Kirim Uji ke Saya</span>
                      </>
                    )}
                  </button>
                </div>
                <BroadcastEmailPreview
                  subject={subject}
                  contentHtml={contentHtml}
                  targetScope={targetScope}
                  previewSender={previewSender}
                  recipientCount={recipientSummary.count}
                  attachments={attachments}
                />
              </div>
            </div>

            {/* LAMPIRAN DOKUMEN PDF */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-navy-800" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">
                      Lampiran Dokumen PDF (Opsional)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Maksimal {MAX_ATTACHMENTS_COUNT} berkas PDF, masing-masing maks. 5 MB, total keseluruhan maks. 10 MB.
                    </p>
                  </div>
                </div>

                <div className="text-xs font-medium text-slate-600 sm:text-right">
                  <span>Total: </span>
                  <strong className={totalAttachmentSize > MAX_TOTAL_ATTACHMENT_SIZE_BYTES ? "text-red-600" : "text-navy-900"}>
                    {(totalAttachmentSize / (1024 * 1024)).toFixed(2)} MB
                  </strong>
                  <span> / 10 MB ({attachments.length} dari {MAX_ATTACHMENTS_COUNT} berkas)</span>
                </div>
              </div>

              {/* FEEDBACK ERROR LAMPIRAN */}
              {attachmentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{attachmentError}</span>
                </div>
              )}

              {/* LIST LAMPIRAN YANG SUDAH DIUNGGAH */}
              {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <div className="p-1.5 bg-red-100/70 text-red-700 rounded-lg shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 truncate block" title={att.fileName}>
                            {att.fileName}
                          </span>
                          <span className="text-slate-500 text-xs block">
                            {(att.sizeBytes / 1024).toFixed(0)} KB ({(att.sizeBytes / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att.id)}
                        disabled={isSubmitting || isUploadingAttachment}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                        title="Hapus berkas ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* TOMBOL / AREA UPLOAD JIKA BELUM 3 BERKAS */}
              {attachments.length < MAX_ATTACHMENTS_COUNT && (
                <div>
                  <label
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed text-xs font-semibold cursor-pointer transition-colors ${
                      isUploadingAttachment
                        ? "border-slate-300 bg-slate-50 text-slate-400 cursor-not-allowed"
                        : "border-navy-300 bg-navy-50/40 text-navy-900 hover:bg-navy-50 hover:border-navy-500"
                    }`}
                  >
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      multiple
                      disabled={isUploadingAttachment || isSubmitting}
                      onChange={handleUploadAttachment}
                      className="hidden"
                    />
                    {isUploadingAttachment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-navy-800" />
                        <span>Mengunggah Berkas PDF...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4 text-navy-800" />
                        <span>Pilih Berkas PDF untuk Dilampirkan</span>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: WAKTU PENGIRIMAN */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-navy-800" />
                <h3 className="font-semibold text-sm text-slate-900">
                  4. Waktu Pengiriman
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                WIB (UTC+7)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  deliveryTimeMode === "NOW"
                    ? "border-navy-900 bg-navy-50/50 ring-2 ring-navy-200 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryTimeMode"
                  value="NOW"
                  checked={deliveryTimeMode === "NOW"}
                  onChange={() => setDeliveryTimeMode("NOW")}
                  className="mt-0.5 text-navy-900 focus:ring-navy-600"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
                    <Send className="w-3.5 h-3.5 text-navy-800" />
                    <span>Kirim Sekarang (Langsung)</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Pengumuman akan langsung diproses dan dikirimkan setelah dikonfirmasi.
                  </p>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  deliveryTimeMode === "SCHEDULED"
                    ? "border-navy-900 bg-navy-50/50 ring-2 ring-navy-200 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryTimeMode"
                  value="SCHEDULED"
                  checked={deliveryTimeMode === "SCHEDULED"}
                  onChange={() => {
                    setDeliveryTimeMode("SCHEDULED");
                    if (!scheduledDateString) {
                      const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
                      setScheduledDateString(toDateTimeLocalString(defaultDate));
                    }
                  }}
                  className="mt-0.5 text-navy-900 focus:ring-navy-600"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Jadwalkan Pengiriman</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Tentukan tanggal dan jam pengiriman otomatis di masa mendatang.
                  </p>
                </div>
              </label>
            </div>

            {deliveryTimeMode === "SCHEDULED" && (
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-slate-800">
                    Pilih Waktu Pengiriman (WIB): <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-500">
                    Minimal 5 menit, maksimal 90 hari ke depan
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1 sm:max-w-xs">
                    <input
                      type="datetime-local"
                      required={deliveryTimeMode === "SCHEDULED"}
                      min={toDateTimeLocalString(new Date(Date.now() + 5 * 60 * 1000))}
                      max={toDateTimeLocalString(
                        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                      )}
                      value={scheduledDateString}
                      onChange={(e) => setScheduledDateString(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent text-slate-900 font-medium"
                    />
                  </div>
                  <span className="text-xs font-semibold text-navy-900 bg-white border border-slate-200 px-3 py-2 rounded-lg shrink-0">
                    Zona Waktu: WIB (Asia/Jakarta)
                  </span>
                </div>

                {scheduledDateString && !Number.isNaN(new Date(scheduledDateString).getTime()) && (
                  <div className="flex items-center gap-2 text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Akan dikirim pada:{" "}
                      <strong>{formatScheduledWib(new Date(scheduledDateString))}</strong>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 5: OPSI PENGIRIMAN TAMBAHAN */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Bell className="w-4 h-4 text-navy-800" />
              <h3 className="font-semibold text-sm text-slate-900">
                5. Opsi Notifikasi Tambahan
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
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <Link
              href="/komunikasi/riwayat"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline hidden sm:inline"
            >
              ← Riwayat Pengumuman
            </Link>
            <button
              type="button"
              onClick={() => setIsSaveDraftModalOpen(true)}
              disabled={isSubmitting || isSendingTest}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              title="Simpan sebagai draf"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Simpan Draf</span>
            </button>
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={isSubmitting || isSendingTest}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
              title={`Kirim email uji ke ${senderCtx.userEmail}`}
            >
              {isSendingTest ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                  <span>Mengirim Uji...</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5 text-slate-600" />
                  <span>Kirim Email Uji</span>
                </>
              )}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSendingTest || isManagerEmpty}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#102E50] hover:bg-[#0c233d] text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              {deliveryTimeMode === "SCHEDULED" ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-gold-400" />
                  <span>Jadwalkan Pengumuman</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-gold-400" />
                  <span>Kirim Pengumuman</span>
                </>
              )}
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
                  <span className="text-slate-500">Waktu Pengiriman:</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {deliveryTimeMode === "SCHEDULED" && scheduledDateString
                      ? `Terjadwal (${formatScheduledWib(new Date(scheduledDateString))})`
                      : "Langsung (Segera setelah dikonfirmasi)"}
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
                {excludedEmployeeIds.length > 0 && (
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500">Dikecualikan:</span>
                    <span className="font-semibold text-amber-700">
                      {excludedEmployeeIds.length} Orang
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Lampiran Dokumen PDF:</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {attachments.length > 0
                      ? `${attachments.length} Berkas (${(totalAttachmentSize / (1024 * 1024)).toFixed(2)} MB)`
                      : "Tanpa Lampiran"}
                  </span>
                </div>
                {attachments.length > 0 && (
                  <div className="border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500 block mb-1">Rincian Berkas PDF:</span>
                    <ul className="text-slate-800 list-disc list-inside space-y-0.5">
                      {attachments.map((a) => (
                        <li key={a.id} className="truncate" title={a.fileName}>
                          {a.fileName} ({(a.sizeBytes / 1024).toFixed(0)} KB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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

              {/* PERINGATAN UMUM / MASSAL ATAU JADWAL */}
              {deliveryTimeMode === "SCHEDULED" ? (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 space-y-3">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="font-semibold text-xs block text-amber-900">
                        Pengiriman Terjadwal
                      </strong>
                      <p className="text-xs leading-relaxed text-amber-800">
                        Pengumuman ini akan disimpan dengan status <strong>TERJADWAL</strong> dan dikirimkan secara otomatis pada{" "}
                        <strong>{scheduledDateString ? formatScheduledWib(new Date(scheduledDateString)) : "waktu yang ditentukan"}</strong>.
                        Daftar penerima aktual akan dievaluasi saat jadwal tiba. Anda dapat membatalkan jadwal ini sewaktu-waktu sebelum waktu pengiriman tiba melalui menu Riwayat Broadcast.
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
                      Saya telah memeriksa isi pengumuman dan mengonfirmasi waktu jadwal pengiriman sudah benar.
                    </span>
                  </label>
                </div>
              ) : isBulk ? (
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
                disabled={
                  isSubmitting ||
                  ((deliveryTimeMode === "SCHEDULED" || isBulk) && !confirmAgreed)
                }
                onClick={handleExecuteSend}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#102E50] hover:bg-[#0c233d] text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
                    <span>
                      {deliveryTimeMode === "SCHEDULED"
                        ? "Menjadwalkan Pengumuman..."
                        : "Sedang Mengirim Email..."}
                    </span>
                  </>
                ) : deliveryTimeMode === "SCHEDULED" ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-gold-400" />
                    <span>Ya, Jadwalkan Pengumuman</span>
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

      {/* DRAWER DRAF & TEMPLATE */}
      <BroadcastDraftTemplateDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        canSendAll={canSendAll}
        drafts={drafts}
        templates={templates}
        activeDraftId={activeDraftId}
        isLoading={isDrawerLoading}
        onLoadDraft={handleLoadDraft}
        onDeleteDraft={handleDeleteDraft}
        onLoadTemplate={handleLoadTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onOpenSaveDraftModal={() => {
          setIsDrawerOpen(false);
          setIsSaveDraftModalOpen(true);
        }}
        onOpenSaveTemplateModal={() => {
          setIsDrawerOpen(false);
          setIsSaveTemplateModalOpen(true);
        }}
      />

      {/* MODAL SIMPAN DRAF */}
      <SaveDraftModal
        isOpen={isSaveDraftModalOpen}
        onClose={() => setIsSaveDraftModalOpen(false)}
        defaultTitle={
          drafts.find((d) => d.id === activeDraftId)?.title ||
          subject.trim() ||
          "Draf Pengumuman"
        }
        isSaving={isSavingDraft}
        onSave={handleSaveDraft}
      />

      {/* MODAL SIMPAN TEMPLATE */}
      <SaveTemplateModal
        isOpen={isSaveTemplateModalOpen}
        onClose={() => setIsSaveTemplateModalOpen(false)}
        canSendAll={canSendAll}
        isSaving={isSavingTemplate}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}
