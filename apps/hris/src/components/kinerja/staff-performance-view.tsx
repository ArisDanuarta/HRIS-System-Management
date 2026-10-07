"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  Lock,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  FileText,
  Target,
  User,
} from "lucide-react";
import { StaffPerformanceReviewData } from "@/server/queries/performance.queries";
import { StaffSelfReviewForm } from "./staff-self-review-form";
import { PerformanceScorecard } from "./performance-scorecard";

interface PeriodOption {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  reviewStatus?: string;
  finalScore?: number | null;
}

interface StaffPerformanceViewProps {
  review: StaffPerformanceReviewData | null;
  periods: PeriodOption[];
  employeeName: string;
  positionTitle?: string;
  departmentName?: string;
  employeeNo?: string;
  selectedPeriodId?: string;
  isManager?: boolean;
}

export function StaffPerformanceView({
  review,
  periods,
  employeeName,
  positionTitle = "Pegawai PSPK",
  departmentName = "Pusat Studi Pendidikan dan Kebijakan",
  employeeNo = "-",
  selectedPeriodId,
  isManager = false,
}: StaffPerformanceViewProps) {
  const router = useRouter();

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const tabParam = isManager ? "&tab=mine" : "";
    if (val) {
      router.push(`/kinerja?periodId=${val}${tabParam}`);
    } else {
      router.push(isManager ? "/kinerja?tab=mine" : "/kinerja");
    }
  };

  // Lifecycle steps definition
  const steps = [
    {
      id: "DRAFT",
      label: "1. Evaluasi Mandiri",
      desc: "Pengisian capaian & skor mandiri oleh staf",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "SELF_REVIEW",
      label: "2. Penilaian Atasan",
      desc: "Peninjauan capaian & catatan dari atasan langsung",
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      id: "MANAGER_REVIEW",
      label: "3. Verifikasi HR",
      desc: "Sinkronisasi komite evaluasi & penetapan skor",
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: "FINALIZED",
      label: "4. Disahkan Resmi",
      desc: "Nilai dikunci & scorecard resmi diterbitkan",
      icon: <Lock className="w-4 h-4" />,
    },
  ];

  const getStepIndex = (status?: string) => {
    switch (status) {
      case "DRAFT":
        return 0;
      case "SELF_REVIEW":
        return 1;
      case "MANAGER_REVIEW":
        return 2;
      case "FINALIZED":
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIndex = getStepIndex(review?.status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Tab Navigation for Manager */}
      {isManager && (
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200/80">
          <Link
            href={`/kinerja?tab=team${selectedPeriodId ? `&periodId=${selectedPeriodId}` : ""}`}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-all"
          >
            Kinerja Tim
          </Link>
          <Link
            href={`/kinerja?tab=mine${selectedPeriodId ? `&periodId=${selectedPeriodId}` : ""}`}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white text-[#102E50] shadow-xs transition-all"
          >
            Kinerja Saya
          </Link>
        </div>
      )}

      {/* Manager Personal Review Notice */}
      {isManager && (
        <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200/80 text-xs text-sky-900 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              Ini adalah lembar evaluasi mandiri pribadi Anda sebagai Lead/Manajer. Evaluasi ini
              akan diteruskan ke Direktur/Atasan Anda.
            </span>
          </div>
          <Link
            href={`/kinerja?tab=team${selectedPeriodId ? `&periodId=${selectedPeriodId}` : ""}`}
            className="shrink-0 font-semibold text-xs text-sky-700 hover:text-sky-900 underline"
          >
            Kembali ke Kinerja Tim &rarr;
          </Link>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Kinerja Saya
            </h1>
            {review && (
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  review.status === "FINALIZED"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : review.status === "DRAFT"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-blue-50 text-blue-800 border-blue-200"
                }`}
              >
                {review.status === "DRAFT" && "Perlu Diisi (Draft)"}
                {review.status === "SELF_REVIEW" && "Menunggu Penilaian Atasan"}
                {review.status === "MANAGER_REVIEW" && "Verifikasi HR Lead"}
                {review.status === "FINALIZED" && "Selesai & Disahkan"}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Evaluasi berkala sasaran riset kebijakan, pencapaian target OKR, dan refleksi kinerja di
            PSPK.
          </p>
        </div>

        {/* Period Selector Dropdown */}
        {periods.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Periode:</span>
            </label>
            <select
              value={selectedPeriodId || review?.period.id || ""}
              onChange={handlePeriodChange}
              className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xs focus:border-[#102E50] focus:ring-1 focus:ring-[#102E50] outline-hidden"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status === "OPEN" ? "Aktif" : "Selesai"})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* JIKA BELUM ADA PERIODE AKTIF SAMA SEKALI */}
      {!review ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-base font-bold text-slate-900">
            Belum Ada Periode Evaluasi Dibuka
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            Saat ini belum ada siklus evaluasi kinerja yang sedang aktif. Anda akan menerima
            notifikasi otomatis ketika Admin HR PSPK membuka periode penilaian baru.
          </p>
        </div>
      ) : (
        <>
          {/* VISUAL STEPPER LIFECYCLE */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Tahapan Evaluasi Kinerja
                </span>
                <span className="text-[11px] font-mono text-slate-500">• {review.period.name}</span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Atasan Penilai: <strong>{review.reviewer?.fullName || "Belum Ditentukan"}</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {steps.map((st, idx) => {
                const isCompleted = idx < currentStepIndex || review.status === "FINALIZED";
                const isCurrent = idx === currentStepIndex && review.status !== "FINALIZED";

                return (
                  <div
                    key={st.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCurrent
                        ? "bg-amber-50/70 border-[#F2AF3E] ring-2 ring-[#F2AF3E]/20"
                        : isCompleted
                          ? "bg-emerald-50/50 border-emerald-200/80 text-emerald-950"
                          : "bg-slate-50/60 border-slate-200/60 text-slate-400 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isCurrent
                              ? "bg-[#102E50] text-[#F2AF3E]"
                              : isCompleted
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        <span
                          className={`text-xs font-bold ${isCurrent ? "text-[#102E50]" : "text-slate-800"}`}
                        >
                          {st.label}
                        </span>
                      </div>
                      {isCurrent && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 pl-8 leading-snug">{st.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KONDISI 1: STATUS DRAFT -> TAMPILKAN FORM SELF REVIEW */}
          {review.status === "DRAFT" && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Formulir Evaluasi Diri Aktif</p>
                  <p className="text-[11px] text-amber-800/90 leading-relaxed">
                    Silakan isi realisasi capaian sasaran riset Anda, tentukan skor evaluasi diri,
                    dan tuliskan refleksi pembelajaran. Setelah dikirim, lembar evaluasi akan
                    langsung diteruskan ke atasan langsung Anda untuk ditinjau.
                  </p>
                </div>
              </div>

              <StaffSelfReviewForm
                reviewId={review.id}
                employeeId={review.employeeId}
                periodId={review.periodId}
                initialSelfScore={review.selfScore}
                initialSelfComment={review.selfComment}
                goals={review.goals}
                totalGoalWeight={review.totalGoalWeight}
                periodName={review.period.name}
                reviewerName={review.reviewer?.fullName || null}
              />
            </div>
          )}

          {/* KONDISI 2: STATUS SELF_REVIEW ATAU MANAGER_REVIEW -> TAMPILKAN MODE MENUNGGU DENGAN SUMMARY READ-ONLY */}
          {(review.status === "SELF_REVIEW" || review.status === "MANAGER_REVIEW") && (
            <div className="space-y-6">
              {/* Banner Menunggu */}
              <div
                className={`p-5 rounded-2xl border flex items-start gap-3 text-xs shadow-xs ${
                  review.status === "SELF_REVIEW"
                    ? "bg-sky-50 border-sky-200 text-sky-950"
                    : "bg-amber-50 border-amber-200 text-amber-950"
                }`}
              >
                <Clock
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    review.status === "SELF_REVIEW" ? "text-sky-600" : "text-amber-600"
                  }`}
                />
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-sm">
                    {review.status === "SELF_REVIEW"
                      ? "Evaluasi Mandiri Anda Telah Terkirim"
                      : "Penilaian Atasan Sedang Diverifikasi HR"}
                  </h4>
                  <p className="text-xs leading-relaxed opacity-90">
                    {review.status === "SELF_REVIEW"
                      ? `Evaluasi mandiri Anda dengan skor ${review.selfScore}/100 telah berhasil diserahkan dan saat ini sedang dalam proses peninjauan oleh atasan langsung Anda (${review.reviewer?.fullName || "Atasan"}).`
                      : `Atasan langsung Anda telah menyelesaikan penilaian tim. Nilai saat ini sedang diverifikasi dan menunggu pengesahan resmi oleh Tim HR PSPK.`}
                  </p>
                </div>
              </div>

              {/* Rangkuman Isian Staf (Read-Only) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#102E50]" />
                    <h3 className="font-serif text-sm font-bold text-slate-900">
                      Rangkuman Evaluasi Mandiri yang Anda Kirimkan
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                    Skor Mandiri: {review.selfScore}/100
                  </span>
                </div>

                {/* Target & Realisasi */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Sasaran Riset & Realisasi Aktual:
                  </span>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                    {review.goals.map((goal, idx) => (
                      <div
                        key={goal.id}
                        className="p-3.5 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <span className="font-mono text-slate-400">#{idx + 1}</span>
                            <span>{goal.title}</span>
                            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                              Bobot {goal.weight}%
                            </span>
                          </div>
                          {goal.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 pl-4">
                              {goal.description}
                            </p>
                          )}
                        </div>
                        <div className="sm:text-right pl-4 sm:pl-0 shrink-0">
                          <span className="text-[11px] text-slate-400 block">
                            Realisasi yang Anda laporkan:
                          </span>
                          <strong className="text-slate-800">{goal.actual || "-"}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Refleksi */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Refleksi Diri yang Dikirimkan:
                  </span>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed italic">
                    &ldquo;{review.selfComment || "Belum ada catatan refleksi."}&rdquo;
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KONDISI 3: STATUS FINALIZED -> TAMPILKAN SCORECARD RESMI */}
          {review.status === "FINALIZED" && (
            <PerformanceScorecard
              review={review}
              employeeName={employeeName}
              positionTitle={positionTitle}
              departmentName={departmentName}
              employeeNo={employeeNo}
            />
          )}
        </>
      )}
    </div>
  );
}
