"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  Calendar,
  Clock,
  Receipt,
  AlertTriangle,
  Award,
  CheckCheck,
  Check,
  Search,
  ExternalLink,
  Filter,
  Info,
} from "lucide-react";
import { NotificationItem } from "@/server/queries/notification.queries";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/server/actions/notification.actions";
import { formatRelativeTime } from "@pspk/shared";

interface NotificationCenterViewProps {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}

export function NotificationCenterView({
  initialNotifications,
  initialUnreadCount,
}: NotificationCenterViewProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Mark single notification as read
  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    startTransition(async () => {
      await markNotificationAsReadAction(id);
      router.refresh();
    });
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;

    // Optimistic UI update
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);

    startTransition(async () => {
      await markAllNotificationsAsReadAction();
      router.refresh();
    });
  };

  // Helper for category icon and styling
  const getCategoryMeta = (category: string) => {
    switch (category) {
      case "LEAVE":
        return {
          icon: <Calendar className="w-5 h-5 text-blue-600" />,
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          label: "Cuti",
        };
      case "ATTENDANCE":
        return {
          icon: <Clock className="w-5 h-5 text-emerald-600" />,
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          label: "Presensi",
        };
      case "PAYROLL":
        return {
          icon: <Receipt className="w-5 h-5 text-amber-600" />,
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          label: "Penggajian",
        };
      case "PERFORMANCE":
        return {
          icon: <Award className="w-5 h-5 text-purple-600" />,
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          label: "Kinerja",
        };
      case "CONTRACT":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          label: "Kontrak",
        };
      default:
        return {
          icon: <Bell className="w-5 h-5 text-[#102e50]" />,
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          label: "Sistem",
        };
    }
  };

  // Helper for type badges
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "ACTION_REQUIRED":
        return {
          label: "Perlu Tindakan",
          className: "bg-rose-100 text-rose-800 border border-rose-300 font-semibold",
        };
      case "WARNING":
        return {
          label: "Penting",
          className: "bg-amber-100 text-amber-800 border border-amber-300 font-semibold",
        };
      case "SUCCESS":
        return {
          label: "Disetujui / Selesai",
          className: "bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold",
        };
      default:
        return {
          label: "Informasi",
          className: "bg-blue-50 text-blue-700 border border-blue-200",
        };
    }
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Tab filter
      if (activeTab === "UNREAD" && item.isRead) return false;

      // Category filter
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchMessage = item.message.toLowerCase().includes(query);
        return matchTitle || matchMessage;
      }

      return true;
    });
  }, [notifications, activeTab, selectedCategory, searchQuery]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: {
      today: NotificationItem[];
      yesterday: NotificationItem[];
      earlier: NotificationItem[];
    } = {
      today: [],
      yesterday: [],
      earlier: [],
    };

    filteredNotifications.forEach((item) => {
      const itemDate = new Date(item.createdAt);
      itemDate.setHours(0, 0, 0, 0);

      if (itemDate.getTime() === today.getTime()) {
        groups.today.push(item);
      } else if (itemDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(item);
      } else {
        groups.earlier.push(item);
      }
    });

    return groups;
  }, [filteredNotifications]);

  interface CategoryCounts {
    ALL: number;
    LEAVE: number;
    ATTENDANCE: number;
    PAYROLL: number;
    PERFORMANCE: number;
    CONTRACT: number;
    SYSTEM: number;
  }

  // Category counts
  const categoryCounts = useMemo<CategoryCounts>(() => {
    const counts: CategoryCounts = {
      ALL: notifications.length,
      LEAVE: 0,
      ATTENDANCE: 0,
      PAYROLL: 0,
      PERFORMANCE: 0,
      CONTRACT: 0,
      SYSTEM: 0,
    };
    notifications.forEach((item) => {
      if (item.category === "LEAVE") counts.LEAVE++;
      else if (item.category === "ATTENDANCE") counts.ATTENDANCE++;
      else if (item.category === "PAYROLL") counts.PAYROLL++;
      else if (item.category === "PERFORMANCE") counts.PERFORMANCE++;
      else if (item.category === "CONTRACT") counts.CONTRACT++;
      else counts.SYSTEM++;
    });
    return counts;
  }, [notifications]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#102e50] text-white shadow-xs">
                <Bell className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#102e50]/70">
                Pemberitahuan & Operasional
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#102e50] tracking-tight">
              Pusat Notifikasi
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Pantau seluruh pengajuan persetujuan, pembaruan status cuti, penerbitan gaji,
              serta pengingat kontrak dan evaluasi kinerja secara terpadu.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0 || isPending}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs cursor-pointer ${
                unreadCount === 0
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  : "bg-white border border-[#102e50]/20 text-[#102e50] hover:bg-[#102e50] hover:text-white"
              }`}
            >
              <CheckCheck className="w-4 h-4" />
              <span>Tandai Semua Dibaca</span>
              {unreadCount > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#f2af3e] text-[#102e50]">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-xs font-medium text-slate-500">Total Notifikasi</div>
            <div className="text-xl sm:text-2xl font-bold text-[#102e50] mt-1">
              {notifications.length}
            </div>
          </div>
          <div
            className={`rounded-xl p-3.5 border ${
              unreadCount > 0
                ? "bg-amber-50/80 border-amber-200 text-amber-900"
                : "bg-slate-50/80 border-slate-200/60 text-slate-700"
            }`}
          >
            <div className="text-xs font-medium">Belum Dibaca</div>
            <div className="text-xl sm:text-2xl font-bold mt-1 flex items-center gap-2">
              <span>{unreadCount}</span>
              {unreadCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
          </div>
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-xs font-medium text-slate-500">Cuti & Presensi</div>
            <div className="text-xl sm:text-2xl font-bold text-[#102e50] mt-1">
              {categoryCounts.LEAVE + categoryCounts.ATTENDANCE}
            </div>
          </div>
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-xs font-medium text-slate-500">Payroll & Kinerja</div>
            <div className="text-xl sm:text-2xl font-bold text-[#102e50] mt-1">
              {categoryCounts.PAYROLL + categoryCounts.PERFORMANCE}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari notifikasi berdasarkan judul atau pesan..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102e50]/20 focus:border-[#102e50] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Status Tab (Semua vs Belum Dibaca) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/60 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-white text-[#102e50] shadow-xs"
                  : "text-slate-600 hover:text-[#102e50]"
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("UNREAD")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "UNREAD"
                  ? "bg-[#102e50] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#102e50]"
              }`}
            >
              <span>Belum Dibaca</span>
              {unreadCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === "UNREAD"
                      ? "bg-[#f2af3e] text-[#102e50]"
                      : "bg-[#102e50] text-white"
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
          <span className="text-slate-400 flex items-center gap-1 mr-1 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap">
            <Filter className="w-3.5 h-3.5" />
            Kategori:
          </span>

          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-[#102e50] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua ({categoryCounts.ALL})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("LEAVE")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === "LEAVE"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Cuti ({categoryCounts.LEAVE})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("ATTENDANCE")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === "ATTENDANCE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Presensi ({categoryCounts.ATTENDANCE})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("PAYROLL")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === "PAYROLL"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Penggajian ({categoryCounts.PAYROLL})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("PERFORMANCE")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === "PERFORMANCE"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Kinerja ({categoryCounts.PERFORMANCE})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("CONTRACT")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === "CONTRACT"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Kontrak ({categoryCounts.CONTRACT})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("SYSTEM")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === "SYSTEM"
                ? "bg-slate-700 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Sistem ({categoryCounts.SYSTEM})</span>
          </button>
        </div>
      </div>

      {/* Notifications List Grouped by Date */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <BellOff className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">Tidak ada notifikasi</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {searchQuery || activeTab === "UNREAD" || selectedCategory !== "ALL"
                ? "Tidak ada notifikasi yang sesuai dengan kriteria filter atau pencarian Anda."
                : "Semua pemberitahuan telah diperbarui. Tidak ada aktivitas tertunda untuk saat ini."}
            </p>
          </div>
          {(searchQuery || activeTab === "UNREAD" || selectedCategory !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("ALL");
                setSelectedCategory("ALL");
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#102e50] text-white hover:bg-[#102e50]/90 transition-colors shadow-xs"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hari Ini */}
          {groupedNotifications.today.length > 0 && (
            <NotificationGroupSection
              title="Hari Ini"
              items={groupedNotifications.today}
              onMarkAsRead={handleMarkAsRead}
              getCategoryMeta={getCategoryMeta}
              getTypeBadge={getTypeBadge}
            />
          )}

          {/* Kemarin */}
          {groupedNotifications.yesterday.length > 0 && (
            <NotificationGroupSection
              title="Kemarin"
              items={groupedNotifications.yesterday}
              onMarkAsRead={handleMarkAsRead}
              getCategoryMeta={getCategoryMeta}
              getTypeBadge={getTypeBadge}
            />
          )}

          {/* Sebelumnya */}
          {groupedNotifications.earlier.length > 0 && (
            <NotificationGroupSection
              title="Sebelumnya"
              items={groupedNotifications.earlier}
              onMarkAsRead={handleMarkAsRead}
              getCategoryMeta={getCategoryMeta}
              getTypeBadge={getTypeBadge}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Subcomponent: Group Section
interface NotificationGroupSectionProps {
  title: string;
  items: NotificationItem[];
  onMarkAsRead: (id: string, e?: React.MouseEvent) => void;
  getCategoryMeta: (category: string) => { icon: React.ReactNode; bg: string; label: string };
  getTypeBadge: (type: string) => { label: string; className: string };
}

function NotificationGroupSection({
  title,
  items,
  onMarkAsRead,
  getCategoryMeta,
  getTypeBadge,
}: NotificationGroupSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
          {title}
        </h2>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          {items.length}
        </span>
        <div className="h-px flex-1 bg-slate-200/80 ml-2" />
      </div>

      <div className="space-y-2.5">
        {items.map((item) => {
          const catMeta = getCategoryMeta(item.category);
          const typeBadge = getTypeBadge(item.type);

          return (
            <div
              key={item.id}
              className={`group relative rounded-2xl p-4 sm:p-5 border transition-all duration-200 ${
                !item.isRead
                  ? "bg-blue-50/30 border-blue-200/80 shadow-xs hover:border-[#102e50]/40"
                  : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
              }`}
            >
              <div className="flex items-start gap-3.5 sm:gap-4">
                {/* Category Icon */}
                <div
                  className={`p-2.5 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${catMeta.bg}`}
                >
                  {catMeta.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category Pill */}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase tracking-wider">
                      {catMeta.label}
                    </span>

                    {/* Type Badge */}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md ${typeBadge.className}`}
                    >
                      {typeBadge.label}
                    </span>

                    {/* Relative Time */}
                    <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
                      <Clock className="w-3.5 h-3.5" />
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className={`text-sm sm:text-base font-semibold leading-snug ${
                      !item.isRead ? "text-[#102e50]" : "text-slate-900"
                    }`}
                  >
                    {item.title}
                  </h3>

                  {/* Message */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.message}
                  </p>

                  {/* Action Link & Mark Read */}
                  <div className="flex items-center gap-3 pt-2">
                    {item.link && (
                      <Link
                        href={item.link}
                        onClick={() => {
                          if (!item.isRead) onMarkAsRead(item.id);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#102e50] hover:text-blue-700 hover:underline transition-colors"
                      >
                        <span>Lihat Dokumen Terkait</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={(e) => onMarkAsRead(item.id, e)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#102e50] transition-colors ml-auto cursor-pointer"
                        title="Tandai sudah dibaca"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tandai Dibaca</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Unread indicator dot */}
                {!item.isRead && (
                  <div className="shrink-0 pt-1">
                    <span
                      className="block w-2.5 h-2.5 rounded-full bg-[#102e50] ring-4 ring-blue-100"
                      title="Belum dibaca"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
