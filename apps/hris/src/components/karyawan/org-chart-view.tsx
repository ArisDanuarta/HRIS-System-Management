"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  ChevronRight,
  Building2,
  ExternalLink,
  ChevronUp,
  LayoutGrid,
  ListTree,
  AlertCircle,
  Edit,
  Layers,
  ShieldCheck,
} from "lucide-react";
import type { OrgChartNode, OrgChartData } from "@/server/queries/org-chart.queries";

interface OrgChartViewProps {
  data: OrgChartData;
  isHrOrAdmin?: boolean;
}

export function OrgChartView({ data, isHrOrAdmin = false }: OrgChartViewProps) {
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [zoom, setZoom] = useState<number>(100);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showUnassignedDrawer, setShowUnassignedDrawer] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle Collapse / Expand satu node
  const toggleCollapse = (nodeId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Expand All
  const handleExpandAll = () => {
    setCollapsedIds(new Set());
  };

  // Collapse All (kecuali level 1)
  const handleCollapseAll = () => {
    const allParentIds = new Set<string>();
    function collect(node: OrgChartNode) {
      if (node.children.length > 0) {
        allParentIds.add(node.id);
        node.children.forEach(collect);
      }
    }
    data.rootNodes.forEach(collect);
    setCollapsedIds(allParentIds);
  };

  // Handler pencarian: auto-expand rantai leluhur dan sorot hasil pertama
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setHighlightedId(null);
      return;
    }

    const q = query.trim().toLowerCase();
    const ancestorIdsToOpen = new Set<string>();
    let firstMatchedId: string | null = null;

    function findAndOpenAncestors(node: OrgChartNode, path: string[]): boolean {
      const isMatch =
        node.fullName.toLowerCase().includes(q) ||
        (node.nickname && node.nickname.toLowerCase().includes(q)) ||
        node.positionTitle.toLowerCase().includes(q) ||
        node.departmentName.toLowerCase().includes(q) ||
        node.employeeNo.toLowerCase().includes(q);

      let childMatched = false;
      for (const child of node.children) {
        if (findAndOpenAncestors(child, [...path, node.id])) {
          childMatched = true;
        }
      }

      if (isMatch || childMatched) {
        if (isMatch && !firstMatchedId) {
          firstMatchedId = node.id;
        }
        for (const ancestorId of path) {
          ancestorIdsToOpen.add(ancestorId);
        }
        return true;
      }

      return false;
    }

    for (const root of data.rootNodes) {
      findAndOpenAncestors(root, []);
    }

    if (ancestorIdsToOpen.size > 0) {
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        ancestorIdsToOpen.forEach((id) => next.delete(id));
        return next;
      });
    }

    setHighlightedId(firstMatchedId);
  };

  // Filter root nodes berdasarkan departemen jika dipilih
  const filteredRootNodes = useMemo(() => {
    if (selectedDepartment === "ALL") return data.rootNodes;
    return data.rootNodes.filter((root) => {
      // Tampilkan root jika root ada di departemen tersebut ATAU memiliki bawahan di departemen tersebut
      function hasDeptInTree(node: OrgChartNode): boolean {
        if (node.departmentId === selectedDepartment) return true;
        return node.children.some(hasDeptInTree);
      }
      return hasDeptInTree(root);
    });
  }, [data.rootNodes, selectedDepartment]);

  return (
    <div className="space-y-6">
      {/* 1. TOP STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#dee9fc] p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Pegawai
            </span>
            <div className="text-2xl font-bold text-[#102E50] font-heading mt-0.5">
              {data.totalEmployees}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Pegawai aktif terdaftar</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#102E50] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#dee9fc] p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pimpinan & Manajer
            </span>
            <div className="text-2xl font-bold text-[#102E50] font-heading mt-0.5">
              {data.totalManagers}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Memiliki anggota tim</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#dee9fc] p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tingkat Hierarki
            </span>
            <div className="text-2xl font-bold text-[#102E50] font-heading mt-0.5">
              {data.maxDepth} Level
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Kedalaman rantai komando</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setShowUnassignedDrawer(true)}
          className={`bg-white rounded-2xl border p-4.5 shadow-xs flex items-center justify-between transition-all cursor-pointer ${
            data.unassignedEmployees.length > 0
              ? "border-amber-300 hover:border-amber-400 bg-amber-50/20"
              : "border-[#dee9fc] hover:border-slate-300"
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Belum Terpetakan
            </span>
            <div className="text-2xl font-bold text-[#A8281C] font-heading mt-0.5">
              {data.unassignedEmployees.length}
            </div>
            <span className="text-[11px] text-amber-800 font-semibold underline">
              Lihat daftar pegawai ↗
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-[#A8281C] flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. CONTROLS & FILTER TOOLBAR */}
      <div className="bg-white rounded-2xl border border-[#dee9fc] p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search & Filter */}
        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, jabatan, NIP..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent bg-slate-50/50 hover:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="relative min-w-[180px]">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50] cursor-pointer text-slate-700"
            >
              <option value="ALL">Semua Divisi ({data.departments.reduce((acc, d) => acc + d.count, 0)})</option>
              {data.departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: View Mode & Tree Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          {/* Mode Switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "tree"
                  ? "bg-white text-[#102E50] shadow-2xs font-extrabold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Bagan Pohon</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-[#102E50] shadow-2xs font-extrabold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ListTree className="w-3.5 h-3.5" />
              <span>Daftar Hierarki</span>
            </button>
          </div>

          {/* Tree Specific Actions (Zoom & Expand) */}
          {viewMode === "tree" && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(50, z - 15))}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#102E50] transition-colors cursor-pointer"
                title="Perkecil Bagan (Zoom Out)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold text-slate-600 px-1 select-none min-w-[42px] text-center">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(150, z + 15))}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#102E50] transition-colors cursor-pointer"
                title="Perbesar Bagan (Zoom In)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(100)}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#102E50] transition-colors cursor-pointer"
                title="Reset Zoom (100%)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-slate-200 mx-1" />

              <button
                type="button"
                onClick={handleExpandAll}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Buka seluruh cabang pohon"
              >
                Buka Semua
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Tutup cabang bawahan"
              >
                Tutup Cabang
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. MAIN CANVAS / VIEW */}
      {viewMode === "tree" ? (
        <div
          ref={containerRef}
          className="bg-radial-[at_top_left] from-slate-50/80 via-white to-slate-50/40 rounded-3xl border border-[#dee9fc] p-8 shadow-xs overflow-auto min-h-[640px] relative no-scrollbar"
        >
          {filteredRootNodes.length === 0 ? (
            <div className="text-center py-24 text-slate-500 max-w-md mx-auto">
              <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-800 text-base">Tidak Ditemukan Struktur</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tidak ada data pegawai yang sesuai dengan filter divisi atau kriteria pencarian Anda.
              </p>
            </div>
          ) : (
            <div
              className="flex justify-center transition-transform duration-200 origin-top pb-12 pt-4"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <div className="flex items-start gap-12">
                {filteredRootNodes.map((root) => (
                  <TreeNode
                    key={root.id}
                    node={root}
                    collapsedIds={collapsedIds}
                    toggleCollapse={toggleCollapse}
                    searchQuery={searchQuery}
                    highlightedId={highlightedId}
                    isHrOrAdmin={isHrOrAdmin}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* LIST / HIERARCHY ACCORDION VIEW */
        <div className="bg-white rounded-3xl border border-[#dee9fc] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-[#102E50] text-sm font-heading">
                Direktori Hierarki Rantai Komando PSPK
              </h3>
              <p className="text-xs text-slate-500">
                Menampilkan struktur berjenjang dari pucuk pimpinan hingga staf pelaksana.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
              {data.totalEmployees} Anggota Terpetakan
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {filteredRootNodes.map((root) => (
              <ListItemNode
                key={root.id}
                node={root}
                depth={0}
                searchQuery={searchQuery}
                isHrOrAdmin={isHrOrAdmin}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. DRAWER / MODAL: PEGAWAI BELUM TERPETAKAN */}
      {showUnassignedDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-amber-200 shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    Pegawai Belum Terpetakan ({data.unassignedEmployees.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pegawai aktif yang belum memiliki atasan langsung (managerId kosong).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUnassignedDrawer(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 pr-1 space-y-1">
              {data.unassignedEmployees.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Semua pegawai aktif telah berhasil dihubungkan ke struktur atasan masing-masing!
                </div>
              ) : (
                data.unassignedEmployees.map((emp) => (
                  <div key={emp.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#102E50] to-[#1c4d82] text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-xs">
                        {emp.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800">{emp.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {emp.positionTitle} • {emp.departmentName}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          NIP: {emp.employeeNo}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/karyawan/${emp.id}`}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#102E50] hover:bg-slate-50 transition-colors"
                      >
                        Profil
                      </Link>
                      {isHrOrAdmin && (
                        <Link
                          href={`/karyawan/${emp.id}/ubah`}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#102E50] text-white hover:bg-[#1a4473] transition-colors inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Atur Atasan</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                💡 Tip: Buka menu <b>Ubah Data Pegawai</b> untuk memilih atasan langsung dari formasi pimpinan.
              </span>
              <button
                type="button"
                onClick={() => setShowUnassignedDrawer(false)}
                className="px-4 py-2 font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
 * SUB-KOMPONEN 1: TREE NODE (Visual Tree Card + Konektor Garis CSS)
 * ========================================================================= */

interface TreeNodeProps {
  node: OrgChartNode;
  collapsedIds: Set<string>;
  toggleCollapse: (id: string) => void;
  searchQuery: string;
  highlightedId: string | null;
  isHrOrAdmin: boolean;
}

function TreeNode({
  node,
  collapsedIds,
  toggleCollapse,
  searchQuery,
  highlightedId,
  isHrOrAdmin,
}: TreeNodeProps) {
  const isCollapsed = collapsedIds.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isHighlighted = highlightedId === node.id;

  const initial = node.fullName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center">
      {/* KARTU PEGAWAI (NODE CARD) */}
      <div
        id={`node-${node.id}`}
        className={`relative w-[280px] bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md p-4 flex flex-col gap-2.5 group ${
          isHighlighted
            ? "border-[#F2AF3E] ring-4 ring-[#F2AF3E]/30 shadow-lg scale-105"
            : node.level === 1
            ? "border-[#102E50] ring-1 ring-[#102E50]/20"
            : "border-slate-200/90 hover:border-[#102E50]/60"
        }`}
      >
        {/* Top Level Pill */}
        <div className="flex items-center justify-between gap-1 text-[10px]">
          <span
            className={`px-2 py-0.5 rounded-md font-bold tracking-tight uppercase ${
              node.level === 1
                ? "bg-[#102E50] text-white"
                : node.level === 2
                ? "bg-[#eff4ff] text-[#102E50] border border-[#dee9fc]"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            Level {node.level} • {node.departmentName}
          </span>

          <span className="text-slate-400 font-mono text-[9px]">#{node.employeeNo}</span>
        </div>

        {/* Profile Details Header */}
        <div className="flex items-start gap-3 pt-1">
          {/* Avatar */}
          <div className="relative shrink-0">
            {node.avatarUrl ? (
              <Image
                src={node.avatarUrl}
                alt={node.fullName}
                width={48}
                height={48}
                unoptimized
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#102E50] to-[#1c4d82] text-white flex items-center justify-center font-bold text-lg font-heading shadow-xs">
                {initial}
              </div>
            )}
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                node.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500"
              }`}
              title={node.status === "ACTIVE" ? "Pegawai Aktif" : "Masa Percobaan / Cuti"}
            />
          </div>

          {/* Name & Position */}
          <div className="flex-1 min-w-0">
            <h4
              className="text-xs font-bold text-[#102E50] font-heading truncate leading-tight group-hover:text-blue-900 transition-colors"
              title={node.fullName}
            >
              {node.fullName}
            </h4>
            <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5" title={node.positionTitle}>
              {node.positionTitle}
            </p>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              {node.employmentTypeName}
            </div>
          </div>
        </div>

        {/* Card Footer Info & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
          {hasChildren ? (
            <span className="inline-flex items-center gap-1 font-bold text-[#102E50] bg-blue-50/80 px-2 py-0.5 rounded-md text-[10px]">
              <Users className="w-3 h-3 text-[#102E50]" />
              <span>
                {node.children.length} Bawahan ({node.totalSubordinatesCount} Tim)
              </span>
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">Staf Anggota</span>
          )}

          <div className="flex items-center gap-1">
            <Link
              href={`/karyawan/${node.id}`}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#102E50] transition-colors"
              title="Buka Profil Lengkap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            {isHrOrAdmin && (
              <Link
                href={`/karyawan/${node.id}/ubah`}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-amber-700 transition-colors"
                title="Ubah Struktur / Atasan"
              >
                <Edit className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* TOMBOL EXPAND / COLLAPSE (Lingkaran di bawah kartu) */}
        {hasChildren && (
          <button
            type="button"
            onClick={() => toggleCollapse(node.id)}
            className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border bg-white flex items-center justify-center text-xs font-bold transition-all shadow-xs z-10 cursor-pointer ${
              isCollapsed
                ? "border-[#F2AF3E] text-[#805600] bg-amber-50 hover:bg-amber-100"
                : "border-slate-300 text-slate-500 hover:bg-slate-100 hover:text-[#102E50]"
            }`}
            title={isCollapsed ? `Tampilkan ${node.children.length} bawahan` : "Tutup bawahan"}
          >
            {isCollapsed ? (
              <span className="text-[10px] font-extrabold leading-none">+{node.children.length}</span>
            ) : (
              <ChevronUp className="w-3 h-3" />
            )}
          </button>
        )}
      </div>

      {/* KONEKTOR GARIS DAN ANAK CABANG */}
      {hasChildren && !isCollapsed && (
        <div className="flex flex-col items-center">
          {/* Garis vertikal pendek dari parent ke horizontal bar */}
          <div className="w-0.5 h-6 bg-slate-300" />

          {/* Pembungkus Baris Anak */}
          <div className="flex items-start">
            {node.children.map((child, index) => {
              const isFirst = index === 0;
              const isLast = index === node.children.length - 1;
              const isOnly = node.children.length === 1;

              return (
                <div key={child.id} className="flex flex-col items-center relative px-3">
                  {/* Garis horizontal penghubung anak */}
                  {!isOnly && (
                    <>
                      {/* Cabang kiri */}
                      <div
                        className={`absolute top-0 left-0 right-1/2 h-0.5 ${
                          isFirst ? "hidden" : "bg-slate-300"
                        }`}
                      />
                      {/* Cabang kanan */}
                      <div
                        className={`absolute top-0 left-1/2 right-0 h-0.5 ${
                          isLast ? "hidden" : "bg-slate-300"
                        }`}
                      />
                    </>
                  )}

                  {/* Garis vertikal turun ke kartu anak */}
                  <div className="w-0.5 h-6 bg-slate-300" />

                  {/* Rekursi Node Anak */}
                  <TreeNode
                    node={child}
                    collapsedIds={collapsedIds}
                    toggleCollapse={toggleCollapse}
                    searchQuery={searchQuery}
                    highlightedId={highlightedId}
                    isHrOrAdmin={isHrOrAdmin}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
 * SUB-KOMPONEN 2: LIST ITEM NODE (Hierarchical Accordion List)
 * ========================================================================= */

interface ListItemNodeProps {
  node: OrgChartNode;
  depth: number;
  searchQuery: string;
  isHrOrAdmin: boolean;
}

function ListItemNode({ node, depth, searchQuery, isHrOrAdmin }: ListItemNodeProps) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const initial = node.fullName.charAt(0).toUpperCase();

  const isMatched =
    searchQuery &&
    (node.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.positionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.departmentName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col gap-1">
      <div
        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
          isMatched
            ? "border-[#F2AF3E] bg-amber-50/30"
            : depth === 0
            ? "border-[#102E50]/20 bg-slate-50/50"
            : "border-slate-200/70 hover:border-slate-300 bg-white"
        }`}
        style={{ marginLeft: `${depth * 28}px` }}
      >
        <div className="flex items-center gap-3">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-500 cursor-pointer"
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-6 h-6 flex items-center justify-center text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            </div>
          )}

          {/* Mini Avatar */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#102E50] to-[#1c4d82] text-white flex items-center justify-center text-xs font-bold font-heading shrink-0">
            {initial}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#102E50]">{node.fullName}</span>
              <span className="text-[10px] text-slate-400 font-mono">#{node.employeeNo}</span>
              <span className="text-[10px] font-semibold bg-[#eff4ff] text-[#102E50] px-2 py-0.5 rounded border border-[#dee9fc]">
                {node.departmentName}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {node.positionTitle} • {node.employmentTypeName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasChildren && (
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              {node.children.length} Bawahan
            </span>
          )}

          <Link
            href={`/karyawan/${node.id}`}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-[#102E50] hover:bg-slate-50 transition-colors"
          >
            Profil
          </Link>
          {isHrOrAdmin && (
            <Link
              href={`/karyawan/${node.id}/ubah`}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-amber-700 transition-colors"
              title="Ubah Data / Atasan"
            >
              <Edit className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {hasChildren &&
        isOpen &&
        node.children.map((child) => (
          <ListItemNode
            key={child.id}
            node={child}
            depth={depth + 1}
            searchQuery={searchQuery}
            isHrOrAdmin={isHrOrAdmin}
          />
        ))}
    </div>
  );
}
