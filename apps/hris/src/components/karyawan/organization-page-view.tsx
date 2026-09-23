"use client";

import React, { useState } from "react";
import {
  Building2,
  Briefcase,
  Users,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { DepartmentItem, OrganizationManagement } from "./organization-management";
import { EmploymentTypeManagement } from "./employment-type-management";
import { EmploymentTypeDetail } from "@/server/queries/employment-type.queries";

interface OrganizationPageViewProps {
  departments: DepartmentItem[];
  stats: {
    totalDepartments: number;
    totalPositions: number;
    mappedEmployeesCount: number;
  };
  employmentTypes: EmploymentTypeDetail[];
}

export function OrganizationPageView({
  departments,
  stats,
  employmentTypes,
}: OrganizationPageViewProps) {
  const [activeTab, setActiveTab] = useState<"structure" | "employmentTypes">("structure");

  const hourlyTypesCount = employmentTypes.filter((t) => t.wageType === "HOURLY").length;
  const monthlyTypesCount = employmentTypes.filter((t) => t.wageType === "MONTHLY").length;
  const activeTypesCount = employmentTypes.filter((t) => t.isActive).length;

  return (
    <div className="space-y-6">
      {/* Segmented Tab Controls */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("structure")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 -mb-px ${
            activeTab === "structure"
              ? "border-[#102E50] text-[#102E50] bg-slate-50/50"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span>Struktur Divisi & Formasi Jabatan</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
            {stats.totalDepartments} Divisi
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("employmentTypes")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 -mb-px ${
            activeTab === "employmentTypes"
              ? "border-[#102E50] text-[#102E50] bg-slate-50/50"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <Briefcase className="w-4 h-4 shrink-0" />
          <span>Tipe Ikatan Kerja (Master)</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-mono font-bold">
            {employmentTypes.length} Tipe
          </span>
        </button>
      </div>

      {/* Tab 1: Struktur Divisi & Jabatan */}
      {activeTab === "structure" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Metric Cards Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Divisi
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-[#102E50] font-heading mt-1">
                  {stats.totalDepartments}
                </span>
                <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Departemen operasional & riset
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#102E50] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Formasi Jabatan
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-[#102E50] font-heading mt-1">
                  {stats.totalPositions}
                </span>
                <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Posisi riset & manajerial
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-[#F2AF3E] flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Pegawai Terpetakan
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-[#102E50] font-heading mt-1">
                  {stats.mappedEmployeesCount}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium mt-0.5">
                  Telah memiliki divisi & jabatan aktif
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          <OrganizationManagement initialDepartments={departments} />
        </div>
      )}

      {/* Tab 2: Tipe Ikatan Kerja */}
      {activeTab === "employmentTypes" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Metric Cards Banner untuk Ikatan Kerja */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Ikatan Kerja
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-[#102E50] font-heading mt-1">
                  {employmentTypes.length}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium mt-0.5">
                  {activeTypesCount} tipe berstatus aktif
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#102E50] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Skema Per Jam (Timesheet)
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-amber-700 font-heading mt-1">
                  {hourlyTypesCount}
                </span>
                <span className="text-[11px] text-amber-600/90 font-medium mt-0.5">
                  Upah durasi kerja (No Work No Pay)
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Skema Gaji Bulanan
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-800 font-heading mt-1">
                  {monthlyTypesCount}
                </span>
                <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Gaji pokok bulanan tetap
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
          </div>

          <EmploymentTypeManagement initialTypes={employmentTypes} />
        </div>
      )}
    </div>
  );
}
