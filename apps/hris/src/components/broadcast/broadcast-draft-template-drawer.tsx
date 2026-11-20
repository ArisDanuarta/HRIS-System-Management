"use client";

import React, { useState } from "react";
import {
  X,
  FileText,
  Bookmark,
  Trash2,
  Share2,
  Lock,
  Plus,
  Loader2,
  Copy,
  Check,
  Folder,
  Calendar,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  BroadcastDraftItem,
  BroadcastTemplateItem,
} from "@/server/schemas/broadcast.schema";

interface BroadcastDraftTemplateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  canSendAll: boolean;
  drafts: BroadcastDraftItem[];
  templates: BroadcastTemplateItem[];
  activeDraftId: string | null;
  isLoading: boolean;
  onLoadDraft: (draft: BroadcastDraftItem) => void;
  onDeleteDraft: (draftId: string) => Promise<void>;
  onLoadTemplate: (template: BroadcastTemplateItem) => void;
  onDeleteTemplate: (templateId: string) => Promise<void>;
  onOpenSaveDraftModal: () => void;
  onOpenSaveTemplateModal: () => void;
}

export function BroadcastDraftTemplateDrawer({
  isOpen,
  onClose,
  canSendAll,
  drafts,
  templates,
  activeDraftId,
  isLoading,
  onLoadDraft,
  onDeleteDraft,
  onLoadTemplate,
  onDeleteTemplate,
  onOpenSaveDraftModal,
  onOpenSaveTemplateModal,
}: BroadcastDraftTemplateDrawerProps) {
  const [activeTab, setActiveTab] = useState<"drafts" | "templates">("drafts");
  const [templateFilter, setTemplateFilter] = useState<"ALL" | "SHARED" | "MY">("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyVar = (v: string) => {
    navigator.clipboard.writeText(v);
    setCopiedVar(v);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const filteredTemplates = templates.filter((t) => {
    if (templateFilter === "SHARED") return t.isShared;
    if (templateFilter === "MY") return t.isOwner;
    return true;
  });

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md lg:max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header Drawer */}
          <div className="p-4 sm:p-5 bg-[#102E50] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#1b3c63] rounded-lg">
                <Bookmark className="w-5 h-5 text-gold-400" />
              </div>
              <div>
                <h3 className="font-bold text-base">Draf &amp; Template Pengumuman</h3>
                <p className="text-slate-300 text-xs mt-0.5">
                  Kelola naskah tersimpan dan template siap pakai
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("drafts")}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === "drafts"
                  ? "border-[#102E50] text-[#102E50]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Draf Saya</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 text-slate-700">
                {drafts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("templates")}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === "templates"
                  ? "border-[#102E50] text-[#102E50]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Template Pengumuman</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 text-slate-700">
                {templates.length}
              </span>
            </button>
          </div>

          {/* Variabel Personalisasi Help Banner */}
          <div className="bg-amber-50/70 border-b border-amber-200/80 px-4 py-2.5 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-semibold block">Variabel Personalisasi Otomatis:</span>
              Gunakan{" "}
              <button
                type="button"
                onClick={() => handleCopyVar("{{nama}}")}
                className="font-mono bg-white text-navy-900 border border-amber-300 px-1 py-0.5 rounded font-semibold hover:bg-amber-100 transition-colors inline-flex items-center gap-1 cursor-pointer mx-0.5"
                title="Klik untuk menyalin"
              >
                {"{{nama}}"}
                {copiedVar === "{{nama}}" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>{" "}
              (Nama Lengkap) atau{" "}
              <button
                type="button"
                onClick={() => handleCopyVar("{{nama_depan}}")}
                className="font-mono bg-white text-navy-900 border border-amber-300 px-1 py-0.5 rounded font-semibold hover:bg-amber-100 transition-colors inline-flex items-center gap-1 cursor-pointer mx-0.5"
                title="Klik untuk menyalin"
              >
                {"{{nama_depan}}"}
                {copiedVar === "{{nama_depan}}" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>{" "}
              di subjek atau naskah. Sistem akan mengganti nilainya secara otomatis per penerima.
            </div>
          </div>

          {/* Action Bar (Simpan Baru) */}
          <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2">
            {activeTab === "drafts" ? (
              <button
                type="button"
                onClick={onOpenSaveDraftModal}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#102E50] hover:bg-[#0c233d] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-gold-400" />
                <span>Simpan Naskah Saat Ini sebagai Draf Baru</span>
              </button>
            ) : (
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setTemplateFilter("ALL")}
                    className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      templateFilter === "ALL"
                        ? "bg-navy-900 text-white font-semibold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateFilter("SHARED")}
                    className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      templateFilter === "SHARED"
                        ? "bg-navy-900 text-white font-semibold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Bersama
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateFilter("MY")}
                    className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      templateFilter === "MY"
                        ? "bg-navy-900 text-white font-semibold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Pribadi
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onOpenSaveTemplateModal}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#102E50] hover:bg-[#0c233d] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-gold-400" />
                  <span>Buat Template</span>
                </button>
              </div>
            )}
          </div>

          {/* Drawer Body List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                <Loader2 className="w-7 h-7 text-navy-800 animate-spin" />
                <p className="text-xs text-slate-500 font-medium">Memuat data...</p>
              </div>
            ) : activeTab === "drafts" ? (
              /* DRAFTS LIST */
              drafts.length === 0 ? (
                <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">Belum Ada Draf Tersimpan</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Simpan rancangan pesan pengumuman Anda sebagai draf agar dapat dilanjutkan kapan saja.
                  </p>
                </div>
              ) : (
                drafts.map((draft) => {
                  const isActive = draft.id === activeDraftId;
                  const isDeleting = deletingId === draft.id;
                  return (
                    <div
                      key={draft.id}
                      className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                        isActive
                          ? "border-navy-900 bg-navy-50/40 ring-1 ring-navy-300 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-semibold text-xs text-slate-900 truncate">
                              {draft.title || draft.subject || "Draf Tanpa Judul"}
                            </h4>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Aktif di Editor
                              </span>
                            )}
                          </div>
                          {draft.subject && (
                            <p className="text-xs text-slate-600 truncate mt-0.5">
                              Subjek: <em>&ldquo;{draft.subject}&rdquo;</em>
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={async () => {
                            if (confirm(`Hapus draf "${draft.title || draft.subject}"?`)) {
                              setDeletingId(draft.id);
                              await onDeleteDraft(draft.id);
                              setDeletingId(null);
                            }
                          }}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                          title="Hapus draf"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                        <span suppressHydrationWarning className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(draft.updatedAt)}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            onLoadDraft(draft);
                            onClose();
                          }}
                          className="text-xs font-semibold text-navy-800 hover:text-navy-950 hover:underline cursor-pointer"
                        >
                          {isActive ? "Muat Ulang Draf" : "Buka & Lanjutkan"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* TEMPLATES LIST */
              filteredTemplates.length === 0 ? (
                <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6">
                  <Bookmark className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">Tidak Ada Template</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    {templateFilter === "ALL"
                      ? "Belum ada template naskah yang disimpan."
                      : "Tidak ada template untuk filter kategori yang dipilih."}
                  </p>
                </div>
              ) : (
                filteredTemplates.map((template) => {
                  const isDeleting = deletingId === template.id;
                  const canDelete = template.isOwner || (canSendAll && template.isShared);

                  return (
                    <div
                      key={template.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-semibold text-xs text-slate-900 truncate">
                              {template.name}
                            </h4>
                            {template.isShared ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                <Share2 className="w-3 h-3" />
                                Bersama
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                <Lock className="w-3 h-3" />
                                Pribadi
                              </span>
                            )}
                            {template.category && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium">
                                <Folder className="w-3 h-3 text-slate-400" />
                                {template.category}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 truncate mt-1">
                            Subjek: <em>&ldquo;{template.subject}&rdquo;</em>
                          </p>
                        </div>

                        {canDelete && (
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={async () => {
                              if (confirm(`Hapus template "${template.name}"?`)) {
                                setDeletingId(template.id);
                                await onDeleteTemplate(template.id);
                                setDeletingId(null);
                              }
                            }}
                            className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                            title="Hapus template"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                        <span suppressHydrationWarning>{formatDate(template.updatedAt)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            onLoadTemplate(template);
                            onClose();
                          }}
                          className="text-xs font-semibold text-navy-800 hover:text-navy-950 hover:underline cursor-pointer"
                        >
                          Gunakan Template
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODAL: SIMPAN SEBAGAI DRAF
// ==========================================

interface SaveDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTitle: string;
  isSaving: boolean;
  onSave: (title: string) => Promise<void>;
}

export function SaveDraftModal({
  isOpen,
  onClose,
  defaultTitle,
  isSaving,
  onSave,
}: SaveDraftModalProps) {
  const [title, setTitle] = useState(defaultTitle || "");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(title);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-[#102E50] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gold-400" />
            <h3 className="font-bold text-sm">Simpan sebagai Draf</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">
              Judul Draf (Pengenal):
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Draf Pengumuman Libur Idul Fitri"
              maxLength={150}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600"
            />
            <p className="text-slate-500 text-xs">
              Kosongkan untuk memakai subjek pengumuman sebagai judul draf.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#102E50] text-white rounded-lg font-semibold hover:bg-[#0c233d] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan Draf</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// MODAL: SIMPAN SEBAGAI TEMPLATE
// ==========================================

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  canSendAll: boolean;
  isSaving: boolean;
  onSave: (data: { name: string; category?: string; isShared: boolean }) => Promise<void>;
}

export function SaveTemplateModal({
  isOpen,
  onClose,
  canSendAll,
  isSaving,
  onSave,
}: SaveTemplateModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama template wajib diisi.");
      return;
    }
    setError(null);
    await onSave({
      name: name.trim(),
      category: category.trim() || undefined,
      isShared: canSendAll ? isShared : false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-[#102E50] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-gold-400" />
            <h3 className="font-bold text-sm">Simpan sebagai Template</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">
              Nama Template: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Undangan Rapat Kerja Rutin"
              maxLength={100}
              required
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">
              Kategori (Opsional):
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Contoh: Internal, Operasional, Acara"
              maxLength={50}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600"
            />
          </div>

          {canSendAll && (
            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="rounded border-slate-300 text-navy-900 focus:ring-navy-600 mt-0.5"
              />
              <span className="text-slate-700 leading-tight">
                <strong>Bagikan ke semua pengirim broadcast</strong> (Template Bersama).
              </span>
            </label>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#102E50] text-white rounded-lg font-semibold hover:bg-[#0c233d] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan Template</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
