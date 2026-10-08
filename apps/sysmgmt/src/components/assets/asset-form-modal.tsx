"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SerializedAsset } from "@/server/queries/asset.queries";
import { createAssetAction, updateAssetAction } from "@/server/actions/asset.actions";
import { formatRupiah } from "@pspk/shared";
import {
  X,
  Package,
  Sparkles,
  Loader2,
  AlertCircle,
  Laptop,
  CheckCircle2,
} from "lucide-react";

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: SerializedAsset | null;
  suggestedTagIt: string;
  suggestedTagNonIt: string;
}

const COMMON_ASSET_TYPES = [
  "Laptop",
  "Monitor",
  "PC Desktop",
  "Printer & Scanner",
  "Router / Jaringan",
  "Proyektor",
  "Meja Kerja",
  "Kursi Kerja",
  "Lemari Arsip",
  "Kendaraan Operasional",
  "Lainnya",
];

export function AssetFormModal({
  isOpen,
  onClose,
  asset,
  suggestedTagIt,
  suggestedTagNonIt,
}: AssetFormModalProps) {
  const router = useRouter();
  const isEdit = Boolean(asset);

  const [category, setCategory] = useState<"IT" | "NON_IT">("IT");
  const [type, setType] = useState("Laptop");
  const [customType, setCustomType] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState<number | "">("");
  const [status, setStatus] = useState<"IN_STOCK" | "ASSIGNED" | "MAINTENANCE" | "RETIRED" | "LOST">(
    "IN_STOCK",
  );
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inisialisasi data form saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    if (asset) {
      setCategory(asset.category);
      if (COMMON_ASSET_TYPES.includes(asset.type)) {
        setType(asset.type);
        setCustomType("");
      } else {
        setType("Lainnya");
        setCustomType(asset.type);
      }
      setName(asset.name);
      setBrand(asset.brand || "");
      setModel(asset.model || "");
      setSerialNumber(asset.serialNumber || "");
      setAssetTag(asset.assetTag);
      setPurchaseDate(
        asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split("T")[0] || "" : "",
      );
      setPurchasePrice(asset.purchasePrice ?? "");
      setStatus(asset.status);
      setLocation(asset.location || "");
      setNotes(asset.notes || "");
    } else {
      // Mode tambah baru
      setCategory("IT");
      setType("Laptop");
      setCustomType("");
      setName("");
      setBrand("");
      setModel("");
      setSerialNumber("");
      setAssetTag(suggestedTagIt);
      setPurchaseDate(new Date().toISOString().split("T")[0] || "");
      setPurchasePrice("");
      setStatus("IN_STOCK");
      setLocation("Kantor PSPK");
      setNotes("");
    }
    setErrorMsg(null);
  }, [isOpen, asset, suggestedTagIt]);

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: "IT" | "NON_IT") => {
    setCategory(newCat);
    if (!isEdit) {
      // Ganti saran tag sesuai kategori
      setAssetTag(newCat === "IT" ? suggestedTagIt : suggestedTagNonIt);
      if (newCat === "NON_IT" && type === "Laptop") {
        setType("Meja Kerja");
      } else if (newCat === "IT" && type === "Meja Kerja") {
        setType("Laptop");
      }
    }
  };

  const handleAutoGenerateTag = () => {
    setAssetTag(category === "IT" ? suggestedTagIt : suggestedTagNonIt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const resolvedType = type === "Lainnya" ? customType.trim() : type;
    if (!resolvedType) {
      setErrorMsg("Tipe/kategori aset wajib diisi.");
      return;
    }

    if (!name.trim()) {
      setErrorMsg("Nama aset wajib diisi.");
      return;
    }

    if (!assetTag.trim()) {
      setErrorMsg("Tag aset wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit && asset) {
        const res = await updateAssetAction({
          id: asset.id,
          category,
          type: resolvedType,
          name: name.trim(),
          brand: brand.trim() || null,
          model: model.trim() || null,
          serialNumber: serialNumber.trim() || null,
          assetTag: assetTag.trim(),
          purchaseDate: purchaseDate || null,
          purchasePrice: purchasePrice === "" ? null : Number(purchasePrice),
          status,
          location: location.trim() || null,
          notes: notes.trim() || null,
        });

        if (!res.ok) {
          setErrorMsg(res.error || "Gagal memperbarui data aset.");
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await createAssetAction({
          category,
          type: resolvedType,
          name: name.trim(),
          brand: brand.trim() || null,
          model: model.trim() || null,
          serialNumber: serialNumber.trim() || null,
          assetTag: assetTag.trim(),
          purchaseDate: purchaseDate || null,
          purchasePrice: purchasePrice === "" ? null : Number(purchasePrice),
          status,
          location: location.trim() || null,
          notes: notes.trim() || null,
        });

        if (!res.ok) {
          setErrorMsg(res.error || "Gagal menambahkan aset baru.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center border border-[#102E50]/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                {isEdit ? "Ubah Data Aset" : "Catat Aset Baru"}
              </h3>
              <p className="text-xs text-slate-500">
                {isEdit
                  ? `Perbarui spesifikasi dan status unit (${asset?.assetTag})`
                  : "Tambahkan barang baru ke dalam katalog inventaris lembaga"}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Kategori Aset (IT vs Non-IT) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Kategori Aset <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleCategoryChange("IT")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  category === "IT"
                    ? "bg-[#102E50] text-white border-[#102E50] shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>Perangkat IT & Elektronik</span>
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange("NON_IT")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  category === "NON_IT"
                    ? "bg-[#102E50] text-white border-[#102E50] shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Fasilitas & Non-IT (Meja, Gedung)</span>
              </button>
            </div>
          </div>

          {/* Tag Aset & Generator Otomatis */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800">
                Tag Aset Unik (Barcode / Label) <span className="text-rose-500">*</span>
              </label>
              {!isEdit && (
                <button
                  type="button"
                  onClick={handleAutoGenerateTag}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 hover:text-amber-900 bg-amber-100/70 hover:bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300/80 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Format Standar PSPK
                </button>
              )}
            </div>
            <input
              type="text"
              required
              value={assetTag}
              onChange={(e) => setAssetTag(e.target.value.toUpperCase())}
              placeholder="Contoh: PSPK-IT-2026-0001"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold tracking-wider text-[#102E50] focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none uppercase"
            />
            <p className="text-[11px] text-slate-500">
              Kode penanda unik yang ditempel pada fisik barang untuk audit dan inventarisasi berkala.
            </p>
          </div>

          {/* Nama & Tipe Barang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Aset <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="mis. MacBook Pro M3 14 Inch"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jenis / Tipe Barang <span className="text-rose-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none"
              >
                {COMMON_ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {type === "Lainnya" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Sebutkan Jenis Barang <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="mis. Mic Wireless, Kamera Mirrorless, dll."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none"
              />
            </div>
          )}

          {/* Brand, Model, Serial Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Merek / Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="mis. Apple, Dell, IKEA"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Model / Tipe Seri</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="mis. Space Black 512GB"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nomor Seri (S/N)</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="mis. C02XYZ12345"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Tanggal & Harga Pembelian */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Pembelian / Perolehan
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Harga Perolehan (Rp)</label>
                {purchasePrice !== "" && (
                  <span className="text-[11px] font-bold text-emerald-700">
                    {formatRupiah(purchasePrice)}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="0"
                step="1000"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value ? Number(e.target.value) : "")}
                placeholder="Contoh: 15000000"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Status & Lokasi Penempatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Status Ketersediaan <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none"
              >
                <option value="IN_STOCK">Tersedia di Gudang (IN_STOCK)</option>
                <option value="ASSIGNED">Sedang Dipinjamkan (ASSIGNED)</option>
                <option value="MAINTENANCE">Dalam Servis / Perbaikan (MAINTENANCE)</option>
                <option value="RETIRED">Afkir / Tidak Digunakan (RETIRED)</option>
                <option value="LOST">Hilang (LOST)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Lokasi Fisik Penempatan
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="mis. Ruang IT Lt. 2, Gudang PSPK"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Catatan / Keterangan Tambahan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Spesifikasi / Kondisi Barang
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Kondisi fisik, kelengkapan adaptor, garansi sampai tanggal X, dll."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#102E50] text-white text-xs font-semibold rounded-lg hover:bg-[#1a4473] transition-colors disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F2AF3E]" />
                  <span>{isEdit ? "Simpan Perubahan" : "Simpan Aset Baru"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
