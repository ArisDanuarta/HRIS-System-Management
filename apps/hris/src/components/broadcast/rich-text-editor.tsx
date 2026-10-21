"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  Link2,
  Unlink,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Upload,
  Globe,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Tuliskan isi pengumuman atau pesan resmi di sini...",
  disabled = false,
}: RichTextEditorProps) {
  // Modal states
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  const [showImageModal, setShowImageModal] = useState(false);
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
          class: "text-navy-900 underline font-medium hover:text-navy-950",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full my-4 shadow-sm border border-slate-200",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Sync external value update jika berbeda
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Handle direct paste of image from clipboard
  const handleEditorPaste = useCallback(
    async (event: React.ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items || !editor) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (!file) continue;

          event.preventDefault();
          setIsUploadingImage(true);

          try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/broadcast/upload-image", {
              method: "POST",
              body: formData,
            });

            const data = await res.json();
            if (res.ok && data.url) {
              editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
            } else {
              alert(data.error || "Gagal mengunggah gambar dari clipboard.");
            }
          } catch {
            alert("Terjadi kesalahan jaringan saat mengunggah gambar.");
          } finally {
            setIsUploadingImage(false);
          }
          break;
        }
      }
    },
    [editor],
  );

  if (!editor) {
    return (
      <div className="w-full min-h-[320px] rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-center text-slate-400 text-sm animate-pulse">
        Memuat editor naskah pengumuman...
      </div>
    );
  }

  // --- Link Actions ---
  const handleOpenLinkModal = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      " ",
    );
    setLinkUrl(previousUrl);
    setLinkText(selectedText);
    setShowLinkModal(true);
  };

  const handleSaveLink = (e?: React.FormEvent | React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run();
      setShowLinkModal(false);
      return;
    }

    let validUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(validUrl) && !validUrl.startsWith("/")) {
      validUrl = `https://${validUrl}`;
    }

    if (linkText.trim() && editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${validUrl}">${linkText.trim()}</a>`)
        .run();
    } else {
      editor.chain().focus().setLink({ href: validUrl }).run();
    }

    setShowLinkModal(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handleRemoveLink = () => {
    editor.chain().focus().unsetLink().run();
    setShowLinkModal(false);
    setLinkUrl("");
    setLinkText("");
  };

  // --- Image Actions ---
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/broadcast/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
        setShowImageModal(false);
        setImageUrl("");
        setImageAlt("");
      } else {
        setUploadError(data.error || "Gagal mengunggah gambar.");
      }
    } catch {
      setUploadError("Terjadi kegagalan jaringan saat mengirim gambar ke server.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleInsertUrlImage = (e?: React.FormEvent | React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!imageUrl.trim()) return;

    editor
      .chain()
      .focus()
      .setImage({
        src: imageUrl.trim(),
        alt: imageAlt.trim() || "Gambar lampiran",
      })
      .run();

    setShowImageModal(false);
    setImageUrl("");
    setImageAlt("");
  };

  // Word & character stats
  const textContent = editor.state.doc.textContent;
  const charCount = textContent.length;
  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;

  return (
    <div className="w-full rounded-xl border border-slate-300 bg-white shadow-sm overflow-hidden focus-within:border-navy-600 focus-within:ring-2 focus-within:ring-navy-100 transition-all">
      {/* --- WORD-LIKE MINIMAL TOOLBAR --- */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 select-none text-slate-700">
        {/* Format Heading */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
            editor.isActive("paragraph") && !editor.isActive("heading")
              ? "bg-[#102E50] text-white font-semibold shadow-xs ring-1 ring-[#102E50]"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Teks Normal / Paragraf"
          disabled={disabled}
        >
          <Pilcrow className="w-3.5 h-3.5" />
          <span>Normal</span>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
            editor.isActive("heading", { level: 2 })
              ? "bg-[#102E50] text-white font-semibold shadow-xs ring-1 ring-[#102E50]"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Judul Utama (H2)"
          disabled={disabled}
        >
          <Heading2 className="w-3.5 h-3.5" />
          <span>Judul 2</span>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
            editor.isActive("heading", { level: 3 })
              ? "bg-[#102E50] text-white font-semibold shadow-xs ring-1 ring-[#102E50]"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Sub Judul (H3)"
          disabled={disabled}
        >
          <Heading3 className="w-3.5 h-3.5" />
          <span>Judul 3</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-300 mx-1" />

        {/* Inline styles: Bold, Italic, Underline, Strikethrough */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor.isActive("bold")
              ? "bg-[#102E50] text-white font-semibold shadow-xs ring-1 ring-[#102E50]"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Tebal (Ctrl+B)"
          disabled={disabled}
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor.isActive("italic")
              ? "bg-[#102E50] text-white font-semibold shadow-xs ring-1 ring-[#102E50]"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Miring (Ctrl+I)"
          disabled={disabled}
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor.isActive("underline")
              ? "bg-[#102E50] text-white font-semibold shadow-xs ring-1 ring-[#102E50]"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Garis Bawah (Ctrl+U)"
          disabled={disabled}
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor.isActive("strike")
              ? "bg-[#102E50] text-white font-semibold shadow-xs ring-1 ring-[#102E50]"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Coret Teks"
          disabled={disabled}
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-slate-300 mx-1" />

        {/* Lists & Quotes */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor.isActive("bulletList")
              ? "bg-[#102E50] text-white font-semibold shadow-xs ring-1 ring-[#102E50]"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Daftar Butir (Bullet List)"
          disabled={disabled}
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor.isActive("orderedList")
              ? "bg-[#102E50] text-white font-semibold shadow-xs ring-1 ring-[#102E50]"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Daftar Angka (Numbered List)"
          disabled={disabled}
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor.isActive("blockquote")
              ? "bg-[#102E50] text-white font-semibold shadow-xs ring-1 ring-[#102E50]"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Kutipan / Callout Penting"
          disabled={disabled}
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-slate-300 mx-1" />

        {/* Insert Link & Image */}
        <button
          type="button"
          onClick={handleOpenLinkModal}
          className={`p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer ${
            editor.isActive("link")
              ? "bg-[#F2AF3E] text-slate-900 font-bold shadow-xs ring-1 ring-[#e09d2c]"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Sisipkan atau Edit Tautan (Link)"
          disabled={disabled}
        >
          <Link2 className="w-4 h-4" />
          <span className="hidden sm:inline">Tautan</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setUploadError(null);
            setShowImageModal(true);
          }}
          className="p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs font-medium hover:bg-slate-200 text-slate-700 cursor-pointer"
          title="Sisipkan Gambar (Unggah / URL)"
          disabled={disabled}
        >
          <ImageIcon className="w-4 h-4 text-navy-800" />
          <span className="hidden sm:inline">Gambar</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-300 mx-1" />

        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo() || disabled}
          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Kembalikan (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo() || disabled}
          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Ulangi (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {isUploadingImage && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-navy-800 font-medium bg-navy-50 px-2 py-1 rounded-md border border-navy-200 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-navy-700" />
            <span>Mengunggah gambar...</span>
          </div>
        )}
      </div>

      {/* --- WRITING SURFACE --- */}
      <div
        className="p-4 sm:p-6 min-h-[280px] bg-white cursor-text tiptap-editor"
        onPaste={handleEditorPaste}
        onClick={() => {
          if (!editor.isFocused) editor.commands.focus();
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* --- STATS FOOTER --- */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span>{wordCount} kata</span>
          <span>•</span>
          <span>{charCount} karakter</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Editor Siap</span>
        </div>
      </div>

      {/* --- MODAL SISIPKAN LINK --- */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-4 py-3 bg-[#102E50] text-white">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-gold-400" />
                <h3 className="font-semibold text-sm">Sisipkan Tautan Web</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Teks yang Ditampilkan
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveLink();
                    }
                  }}
                  placeholder="Contoh: Buka Dokumen Panduan"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Alamat URL Tujuan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveLink();
                    }
                  }}
                  placeholder="https://drive.google.com/... atau https://pspk.id"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent font-mono text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                {editor.isActive("link") ? (
                  <button
                    type="button"
                    onClick={handleRemoveLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium cursor-pointer"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Hapus Tautan</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLinkModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveLink()}
                    className="px-4.5 py-2 text-xs font-semibold bg-[#102E50] hover:bg-[#0c233d] text-white rounded-lg transition-all shadow-sm cursor-pointer"
                  >
                    Simpan Tautan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL SISIPKAN GAMBAR --- */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-4 py-3 bg-[#102E50] text-white">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-gold-400" />
                <h3 className="font-semibold text-sm">Sisipkan Gambar ke Naskah</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-medium">
              <button
                type="button"
                onClick={() => setImageTab("upload")}
                className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                  imageTab === "upload"
                    ? "border-[#102E50] text-[#102E50] bg-white font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah dari Komputer</span>
              </button>
              <button
                type="button"
                onClick={() => setImageTab("url")}
                className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                  imageTab === "url"
                    ? "border-[#102E50] text-[#102E50] bg-white font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Tautan URL Web</span>
              </button>
            </div>

            {uploadError && (
              <div className="mx-4 mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{uploadError}</span>
              </div>
            )}

            {imageTab === "upload" ? (
              <div className="p-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-navy-600 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-navy-50/30 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleUploadFile}
                    className="hidden"
                  />
                  {isUploadingImage ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-7 h-7 text-navy-700 animate-spin" />
                      <p className="text-xs font-medium text-slate-700">
                        Mengunggah gambar ke server...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-2.5 bg-white rounded-full shadow-xs border border-slate-200 group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5 text-navy-800" />
                      </div>
                      <p className="text-xs font-semibold text-slate-800">
                        Klik untuk memilih gambar atau seret berkas ke sini
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Format didukung: JPG, PNG, WebP, GIF (Maks. 3 MB)
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowImageModal(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Alamat URL Gambar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleInsertUrlImage();
                      }
                    }}
                    placeholder="https://example.com/banner.jpg"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Keterangan Gambar (Alt Text)
                  </label>
                  <input
                    type="text"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleInsertUrlImage();
                      }
                    }}
                    placeholder="Contoh: Bagan Alur Kerja Tim"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImageModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertUrlImage()}
                    className="px-4.5 py-2 text-xs font-semibold bg-[#102E50] hover:bg-[#0c233d] text-white rounded-lg transition-all shadow-sm cursor-pointer"
                  >
                    Sisipkan Gambar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
