"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SerializedCredential,
  CredentialStats,
  CredentialsDirectoryResult,
  ActiveEmployeePicOption,
  CredentialFilterParams,
} from "@/server/queries/credential.queries";
import { CredentialCategory, TwoFactorType } from "@pspk/db";
import { CredentialTable } from "./credential-table";
import { CredentialFormModal } from "./credential-form-modal";
import { CredentialRevealModal } from "./credential-reveal-modal";
import { CredentialDeleteModal } from "./credential-delete-modal";
import {
  KeyRound,
  Plus,
  Search,
  RotateCcw,
  ShieldCheck,
  ClockAlert,
  Layers,
  Share2,
  Globe,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react";
import { CATEGORY_META } from "./credential-constants";

interface CredentialListViewProps {
  credentialsData: CredentialsDirectoryResult;
  stats: CredentialStats;
  picEmployees: ActiveEmployeePicOption[];
  canManage: boolean;
  canReveal: boolean;
  initialFilters: {
    search: string;
    category: string;
    twoFactor: string;
    status: string;
    needsRotationOnly: boolean;
    page: number;
  };
}

export function CredentialListView({
  credentialsData,
  stats,
  picEmployees,
  canManage,
  canReveal,
  initialFilters,
}: CredentialListViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(initialFilters.search);
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category);
  const [selectedTwoFactor, setSelectedTwoFactor] = useState(initialFilters.twoFactor);
  const [selectedStatus, setSelectedStatus] = useState(initialFilters.status);
  const [needsRotationOnly, setNeedsRotationOnly] = useState(initialFilters.needsRotationOnly);

  // State Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<SerializedCredential | null>(null);
  const [deletingCredential, setDeletingCredential] = useState<SerializedCredential | null>(null);
  const [revealingCredential, setRevealingCredential] = useState<SerializedCredential | null>(null);

  const applyFilters = (
    newSearch?: string,
    newCategory?: string,
    newTwoFactor?: string,
    newStatus?: string,
    newNeedsRotation?: boolean,
    newPage?: number,
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    const s = newSearch !== undefined ? newSearch : searchInput;
    const cat = newCategory !== undefined ? newCategory : selectedCategory;
    const tf = newTwoFactor !== undefined ? newTwoFactor : selectedTwoFactor;
    const stat = newStatus !== undefined ? newStatus : selectedStatus;
    const rot = newNeedsRotation !== undefined ? newNeedsRotation : needsRotationOnly;
    const p = newPage !== undefined ? newPage : 1;

    if (s.trim()) params.set("q", s.trim());
    else params.delete("q");

    if (cat && cat !== "ALL") params.set("category", cat);
    else params.delete("category");

    if (tf && tf !== "ALL") params.set("twoFactor", tf);
    else params.delete("twoFactor");

    if (stat && stat !== "ALL") params.set("status", stat);
    else params.delete("status");

    if (rot) params.set("needsRotation", "true");
    else params.delete("needsRotation");

    if (p > 1) params.set("page", p.toString());
    else params.delete("page");

    router.push(`/kredensial?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(searchInput, selectedCategory, selectedTwoFactor, selectedStatus, needsRotationOnly, 1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSelectedCategory("ALL");
    setSelectedTwoFactor("ALL");
    setSelectedStatus("ALL");
    setNeedsRotationOnly(false);
    router.push("/kredensial");
  };

  const isFiltering =
    Boolean(searchInput.trim()) ||
    selectedCategory !== "ALL" ||
    selectedTwoFactor !== "ALL" ||
    selectedStatus !== "ALL" ||
    needsRotationOnly;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Brankas Kredensial & Akun
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif">
            Akun & Kredensial Lembaga
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan terpusat akun media sosial, hosting, domain, SaaS, dan portal instansi dengan enkripsi AES-256-GCM.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => {
              setEditingCredential(null);
              setIsFormModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#102E50] text-white text-xs font-semibold rounded-xl hover:bg-[#1a4473] transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kredensial</span>
          </button>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Kredensial */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#102E50] flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Akun Terdaftar
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5 font-serif">
              {stats.totalCredentials}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>{stats.activeCount} akun aktif operasional</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Proteksi 2FA */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Proteksi 2FA Aktif
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5 font-serif">
              {stats.twoFactorProtectedCount}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              <span className="text-emerald-700 font-bold">{stats.twoFactorAdoptionRate}%</span> adopsi 2FA
            </div>
          </div>
        </div>

        {/* KPI 3: Perlu Rotasi Password */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl ${stats.needsRotationCount > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-500 border-slate-200"} flex items-center justify-center shrink-0 border shadow-2xs`}
          >
            <ClockAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Perlu Rotasi Sandi
            </span>
            <div
              className={`text-2xl font-bold mt-0.5 font-serif ${stats.needsRotationCount > 0 ? "text-amber-800" : "text-slate-900"}`}
            >
              {stats.needsRotationCount}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              <span>≥ 90 hari / belum rotasi</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Komposisi Utama */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-200 shadow-2xs">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Layanan Populer
            </span>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-700">
              <span className="inline-flex items-center gap-1 font-semibold text-pink-700 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200">
                <Share2 className="w-2.5 h-2.5" />
                {stats.socialMediaCount}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                <Globe className="w-2.5 h-2.5" />
                {stats.websiteHostingCount}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                <Layers className="w-2.5 h-2.5" />
                {stats.saasToolsCount}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Sosmed, Web, & SaaS</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama layanan, username, email, url, atau nama PIC..."
              className="w-full text-xs pl-9.5 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#102E50] text-white text-[11px] font-semibold rounded-lg hover:bg-[#1a4473] transition-colors"
            >
              Cari
            </button>
          </form>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Kategori */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                applyFilters(
                  searchInput,
                  e.target.value,
                  selectedTwoFactor,
                  selectedStatus,
                  needsRotationOnly,
                  1,
                );
              }}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
            >
              <option value="ALL">Semua Kategori</option>
              {Object.entries(CATEGORY_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>

            {/* Filter 2FA */}
            <select
              value={selectedTwoFactor}
              onChange={(e) => {
                setSelectedTwoFactor(e.target.value);
                applyFilters(
                  searchInput,
                  selectedCategory,
                  e.target.value,
                  selectedStatus,
                  needsRotationOnly,
                  1,
                );
              }}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
            >
              <option value="ALL">Semua Proteksi 2FA</option>
              <option value="WITH_2FA">Terproteksi 2FA</option>
              <option value="WITHOUT_2FA">Tanpa 2FA</option>
              <option value="AUTHENTICATOR_APP">App Authenticator</option>
              <option value="SMS_OTP">SMS OTP</option>
              <option value="EMAIL_OTP">Email OTP</option>
              <option value="HARDWARE_KEY">Hardware Key</option>
              <option value="BACKUP_CODES">Backup Codes</option>
            </select>

            {/* Filter Status */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                applyFilters(
                  searchInput,
                  selectedCategory,
                  selectedTwoFactor,
                  e.target.value,
                  needsRotationOnly,
                  1,
                );
              }}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif Saja</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>

            {/* Checkbox Perlu Rotasi */}
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={needsRotationOnly}
                onChange={(e) => {
                  setNeedsRotationOnly(e.target.checked);
                  applyFilters(
                    searchInput,
                    selectedCategory,
                    selectedTwoFactor,
                    selectedStatus,
                    e.target.checked,
                    1,
                  );
                }}
                className="w-3.5 h-3.5 text-[#102E50] rounded border-slate-300 focus:ring-[#102E50]"
              />
              <span>Perlu Rotasi</span>
            </label>

            {/* Reset Button */}
            {isFiltering && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold rounded-xl transition-colors"
                title="Reset seluruh filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Credential Table */}
      <CredentialTable
        credentials={credentialsData.credentials}
        canManage={canManage}
        canReveal={canReveal}
        pagination={{
          page: credentialsData.page,
          totalPages: credentialsData.totalPages,
          total: credentialsData.total,
          limit: credentialsData.limit,
        }}
        onPageChange={(newPage) => {
          applyFilters(
            searchInput,
            selectedCategory,
            selectedTwoFactor,
            selectedStatus,
            needsRotationOnly,
            newPage,
          );
        }}
        onEditCredential={(cred) => {
          setEditingCredential(cred);
          setIsFormModalOpen(true);
        }}
        onDeleteCredential={(cred) => {
          setDeletingCredential(cred);
        }}
        onRevealPassword={(cred) => {
          setRevealingCredential(cred);
        }}
      />

      {/* Modals */}
      <CredentialFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingCredential(null);
        }}
        initialData={editingCredential}
        picEmployees={picEmployees}
      />

      <CredentialRevealModal
        isOpen={Boolean(revealingCredential)}
        onClose={() => setRevealingCredential(null)}
        credential={revealingCredential}
      />

      <CredentialDeleteModal
        isOpen={Boolean(deletingCredential)}
        onClose={() => setDeletingCredential(null)}
        credential={deletingCredential}
      />
    </div>
  );
}
