"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SerializedSoftwareLicense } from "@/server/queries/license.queries";
import {
  createLicenseAction,
  updateLicenseAction,
} from "@/server/actions/license.actions";
import {
  KeyRound,
  Loader2,
  X,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

interface LicenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: SerializedSoftwareLicense | null;
}

const COMMON_VENDORS = [
  "Google Cloud",
  "Zoom Video",
  "Microsoft 365",
  "Figma Inc",
  "JetBrains",
  "Canva",
  "Adobe",
  "OpenAI",
  "Atlassian",
  "Slack",
  "Notion",
  "1Password",
  "Bitwarden",
  "Claude / Anthropic",
  "AWS",
  "DigitalOcean",
];

export function LicenseFormModal({
  isOpen,
  onClose,
  initialData,
}: LicenseFormModalProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData);

  const [name, setName] = useState("");
  const [vendor, setVendor] = useState("");
  const [seatsTotal, setSeatsTotal] = useState<number | string>(1);
  const [seatsUsed, setSeatsUsed] = useState<number | string>(0);
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [clearLicenseKey, setClearLicenseKey] = useState(false);
  const [notes, setNotes] = useState("");

  const [showKeyText, setShowKeyText] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setVendor(initialData.vendor || "");
      setSeatsTotal(initialData.seatsTotal);
      setSeatsUsed(initialData.seatsUsed);
      setPurchaseDate(
        initialData.purchaseDate
          ? new Date(initialData.purchaseDate).toISOString().split("T")[0] || ""
          : "",
      );
      setExpiresAt(
        initialData.expiresAt
          ? new Date(initialData.expiresAt).toISOString().split("T")[0] || ""
          : "",
      );
      setLicenseKey("");
      setClearLicenseKey(false);
      setNotes(initialData.notes || "");
    } else {
      setName("");
      setVendor("");
      setSeatsTotal(1);
      setSeatsUsed(0);
      setPurchaseDate("");
      setExpiresAt("");
      setLicenseKey("");
      setClearLicenseKey(false);
      setNotes("");
    }
    setErrorMsg(null);
    setShowKeyText(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const total = parseInt(seatsTotal.toString(), 10) || 1;
    const used = parseInt(seatsUsed.toString(), 10) || 0;

    if (!name.trim()) {
      setErrorMsg("Nama lisensi software wajib diisi.");
      return;
    }

    if (total < 1) {
      setErrorMsg("Total kursi minimal 1.");
      return;
    }

    if (used < 0) {
      setErrorMsg("Kursi terpakai tidak boleh negatif.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && initialData) {
        const res = await updateLicenseAction({
          id: initialData.id,
          name: name.trim(),
          vendor: vendor.trim() || null,
          seatsTotal: total,
          seatsUsed: used,
          purchaseDate: purchaseDate || null,
          expiresAt: expiresAt || null,
          licenseKey: licenseKey.trim() || undefined,
          clearLicenseKey,
          notes: notes.trim() || null,
        });

        if (!res.ok) {
          setErrorMsg(res.error || "Gagal memperbarui lisensi.");
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await createLicenseAction({
          name: name.trim(),
          vendor: vendor.trim() || null,
          seatsTotal: total,
          seatsUsed: used,
          purchaseDate: purchaseDate || null,
          expiresAt: expiresAt || null,
          licenseKey: licenseKey.trim() || undefined,
          notes: notes.trim() || null,
        });

        if (!res.ok) {
          setErrorMsg(res.error || "Gagal menambahkan lisensi.");
          setIsSubmitting(false);
          return;
        }
      }

      router.refresh();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  {isEditing ? "Ubah Lisensi Software" : "Tambah Lisensi Software Baru"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isEditing
                    ? "Perbarui alokasi kursi, tanggal masa berlaku, atau kunci produk."
                    : "Daftarkan langganan tools dan kunci produk baru ke sistem."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Nama Lisensi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Perangkat Lunak / Lisensi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Google Workspace Enterprise"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              />
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor / Penyedia Layanan
              </label>
              <input
                type="text"
                list="vendor-suggestions"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Pilih atau ketik nama vendor (mis. Google Cloud, Figma, Zoom)"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              />
              <datalist id="vendor-suggestions">
                {COMMON_VENDORS.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>

              {/* Rekomendasi Cepat Vendor */}
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Cepat:
                </span>
                {["Google Cloud", "Zoom Video", "Figma Inc", "Microsoft 365", "Canva"].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setVendor(quick)}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200/80 text-slate-600 rounded-md transition-colors"
                  >
                    {quick}
                  </button>
                ))}
              </div>
            </div>

            {/* Kapasitas Kursi: Total & Terpakai */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Kursi (Seats) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={seatsTotal}
                  onChange={(e) => setSeatsTotal(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kursi Terpakai <span className="text-slate-400 font-normal">(Saat ini)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={seatsUsed}
                  onChange={(e) => setSeatsUsed(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                />
              </div>
            </div>

            {/* Tanggal Beli & Kedaluwarsa */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Pembelian
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Kedaluwarsa
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Kosongkan jika langganan tetap / seumur hidup.
                </span>
              </div>
            </div>

            {/* Kunci Produk (Serial Key) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#102E50]" />
                  <span>Kunci Lisensi / Serial Produk</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Terenkripsi AES-256
                  </span>
                </label>
                {licenseKey && (
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    {showKeyText ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showKeyText ? "Sembunyikan" : "Tampilkan"}</span>
                  </button>
                )}
              </div>

              <input
                type={showKeyText ? "text" : "password"}
                value={licenseKey}
                disabled={clearLicenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder={
                  isEditing
                    ? "Biarkan kosong jika tidak ingin mengubah kunci tersimpan"
                    : "Masukkan nomor seri atau kunci produk lisensi..."
                }
                className="w-full text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] disabled:bg-slate-100 disabled:text-slate-400 font-mono"
              />

              {isEditing && initialData?.hasLicenseKey && (
                <label className="flex items-center gap-2 pt-1 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clearLicenseKey}
                    onChange={(e) => setClearLicenseKey(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span className={clearLicenseKey ? "text-rose-600 font-medium" : ""}>
                    Hapus kunci produk yang tersimpan pada lisensi ini
                  </span>
                </label>
              )}
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan / ID Akun Penagihan
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan pembayaran, email akun master, atau tautan portal admin vendor..."
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              />
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#102E50] hover:bg-[#1a4473] text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{isEditing ? "Perbarui Lisensi" : "Simpan Lisensi"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
