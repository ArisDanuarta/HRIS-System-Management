"useclient";

import React, { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Check } from "lucide-react";
import { markBroadcastAsReadAction } from "../../server/actions/broadcast.actions";

interface BroadcastReadConfirmationProps {
  broadcastId: string;
  initialReadAt?: Date | string | null;
}

export function BroadcastReadConfirmation({
  broadcastId,
  initialReadAt,
}: BroadcastReadConfirmationProps) {
  const [readAt, setReadAt] = useState<Date | string | null>(initialReadAt || null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleConfirmRead = () => {
    setError(null);
    startTransition(async () => {
      const res = await markBroadcastAsReadAction(broadcastId);
      if (res.success && res.readAt) {
        setReadAt(res.readAt);
      } else {
        setError(res.error || "Gagal mengonfirmasi pembacaan pengumuman.");
      }
    });
  };

  const formatDate = (dateVal: Date | string) => {
    const d = new Date(dateVal);
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (readAt) {
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div>
            <span className="font-semibold block text-emerald-950">
              Konfirmasi Membaca Tercatat
            </span>
            <span className="text-emerald-800 mt-0.5 block">
              Anda telah mengonfirmasi membaca pengumuman ini pada{" "}
              <strong>{formatDate(readAt)} WIB</strong>.
            </span>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Terkonfirmasi</span>
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs">
      <div>
        <span className="font-bold text-amber-900 text-xs block uppercase tracking-wider">
          Konfirmasi Wajib Membaca
        </span>
        <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">
          Pengirim meminta tanda bukti bahwa Anda telah membaca dan memahami isi pengumuman penting ini.
        </p>
        {error && <p className="text-xs text-red-600 font-semibold mt-1">{error}</p>}
      </div>

      <button
        type="button"
        disabled={isPending}
        onClick={handleConfirmRead}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#102E50] hover:bg-[#0c233d] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
      >
        {isPending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-gold-400" />
            <span>Menyimpan...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 text-gold-400" />
            <span>Saya Sudah Membaca Pengumuman Ini</span>
          </>
        )}
      </button>
    </div>
  );
}
