"use client";

import React, { useMemo } from "react";
import sanitizeHtml from "sanitize-html";
import type { ResolvedSenderIdentity } from "../../server/schemas/broadcast.schema";

export interface BroadcastEmailPreviewProps {
  subject: string;
  contentHtml: string;
  targetScope: string;
  previewSender: ResolvedSenderIdentity;
  recipientCount?: number;
}

export function BroadcastEmailPreview({
  subject,
  contentHtml,
  targetScope,
  previewSender,
  recipientCount,
}: BroadcastEmailPreviewProps) {
  // Absolutize relative image URLs for live preview
  const sanitizedDisplayHtml = useMemo(() => {
    if (!contentHtml || contentHtml === "<p></p>") return "";

    const cleaned = sanitizeHtml(contentHtml, {
      allowedTags: [
        "p",
        "h2",
        "h3",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "strike",
        "ul",
        "ol",
        "li",
        "blockquote",
        "a",
        "img",
        "br",
        "div",
        "span",
      ],
      allowedAttributes: {
        a: ["href", "target", "rel", "class"],
        img: ["src", "alt", "class", "style", "width", "height"],
        div: ["class", "style"],
        p: ["class", "style"],
        span: ["class", "style"],
        blockquote: ["class", "style"],
      },
      allowedSchemes: ["http", "https", "mailto"],
      allowedSchemesByTag: { img: ["http", "https"] },
      allowProtocolRelative: false,
    });

    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      return cleaned.replace(
        /(<img\b[^>]*?\ssrc=")(\/api\/documents\/[^"]+)(")/gi,
        (_m, pre: string, path: string, post: string) => `${pre}${origin}${path}${post}`,
      );
    }

    return cleaned;
  }, [contentHtml]);

  const scopeBadgeLabel =
    targetScope === "ALL_EMPLOYEES"
      ? "PENGUMUMAN ORGANISASI"
      : targetScope === "DEPARTMENT"
        ? "PENGUMUMAN DIVISI"
        : targetScope === "CUSTOM"
          ? "PEGAWAI TERPILIH"
          : "PENGUMUMAN TIM";

  return (
    <div className="rounded-xl border border-slate-300 overflow-hidden shadow-xs bg-slate-100 animate-in fade-in duration-150">
      {/* SIMULATED CLIENT INBOX HEADER */}
      <div className="bg-slate-200/90 border-b border-slate-300 px-4 py-3 space-y-1 text-xs text-slate-700">
        <div className="flex items-center justify-between border-b border-slate-300/60 pb-1.5">
          <span className="font-semibold text-slate-900 line-clamp-1">
            Subjek: [PSPK HRIS] {subject.trim() || "(Subjek belum diisi)"}
          </span>
          {typeof recipientCount === "number" && (
            <span className="text-slate-600 shrink-0 font-medium ml-2">
              {recipientCount} Penerima
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-0.5 text-slate-600">
          <div className="line-clamp-1">
            <span className="text-slate-500">Dari:</span>{" "}
            <strong className="text-slate-800">{previewSender.displayName}</strong>{" "}
            &lt;no-reply@pspk.id&gt;
          </div>
          <div className="line-clamp-1">
            <span className="text-slate-500">Balas Ke:</span>{" "}
            <span className="font-mono text-slate-800">
              {previewSender.replyToMode === "NO_REPLY"
                ? "no-reply@pspk.id (Satu Arah)"
                : previewSender.replyToEmail}
            </span>
          </div>
        </div>
      </div>

      {/* SIMULATED EMAIL BODY CONTAINER */}
      <div className="p-3 sm:p-5">
        <div className="max-w-[620px] mx-auto bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          {/* Email Header PSPK */}
          <div className="bg-[#102E50] p-5 text-center border-b-4 border-[#F2AF3E]">
            <h1 className="text-white text-base font-bold tracking-wide">
              Pusat Studi Pendidikan dan Kebijakan
            </h1>
            <p className="text-slate-300 text-xs uppercase tracking-wider font-semibold mt-1">
              Portal Sistem HRIS &amp; Manajemen Organisasi
            </p>
          </div>

          {/* Email Body Content */}
          <div className="p-5 sm:p-7 space-y-4">
            <div>
              <span className="inline-block bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                {scopeBadgeLabel}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed">
              {previewSender.isPersonal ? (
                <>
                  Pengumuman diterbitkan oleh:{" "}
                  <strong className="text-slate-900">{previewSender.displayName}</strong> (
                  {previewSender.displayTitle})
                </>
              ) : (
                <>
                  Diterbitkan secara resmi oleh:{" "}
                  <strong className="text-slate-900">{previewSender.displayName}</strong> &bull;{" "}
                  <span className="italic">{previewSender.displayTitle}</span>
                </>
              )}
            </div>

            <div className="text-sm font-semibold text-[#102E50]">
              Halo [Nama Karyawan],
            </div>

            <div
              className="prose prose-sm max-w-none text-slate-700 leading-relaxed tiptap-editor break-words"
              dangerouslySetInnerHTML={{
                __html:
                  sanitizedDisplayHtml ||
                  "<p class='text-slate-500 italic'>[Isi pesan belum ditulis. Silakan tulis naskah di editor]</p>",
              }}
            />

            {previewSender.replyToMode === "NO_REPLY" ? (
              <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-700 leading-relaxed">
                <strong>Pemberitahuan:</strong> Email ini bersifat pengumuman satu arah resmi dari{" "}
                <strong>{previewSender.displayName}</strong>. Mohon tidak membalas langsung ke alamat email ini.
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 leading-relaxed">
                <strong>Diskusi &amp; Pertanyaan:</strong> Anda dapat langsung membalas (*Reply*) email ini dari aplikasi email Anda untuk terhubung langsung dengan{" "}
                <strong>
                  {previewSender.replyToMode === "ORGANIZATION_HR"
                    ? "Tim People & Culture (HR) PSPK"
                    : previewSender.replyToEmail || previewSender.displayName}
                </strong>
                {previewSender.replyToEmail && previewSender.replyToEmail !== "no-reply@pspk.id" ? (
                  <span> ({previewSender.replyToEmail})</span>
                ) : null}
                .
              </div>
            )}
          </div>

          {/* Email Footer */}
          <div className="bg-slate-50 p-4 text-center text-xs text-slate-600 border-t border-slate-200 leading-relaxed">
            <p className="m-0">
              Email ini dikirimkan secara resmi melalui Sistem HRIS PSPK menggunakan akun <strong>no-reply@pspk.id</strong>.
            </p>
            <p className="m-0 mt-1">
              &copy; {new Date().getFullYear()} Yayasan Pusat Studi Pendidikan dan Kebijakan (PSPK).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
