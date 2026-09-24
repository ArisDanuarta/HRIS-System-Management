"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  Clock,
  Receipt,
  AlertTriangle,
  Award,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { formatRelativeTime } from "@pspk/shared";
import {
  getNavbarNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/server/actions/notification.actions";
import { NotificationItem } from "@/server/queries/notification.queries";

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch initial notifications
  const loadNotifications = () => {
    startTransition(async () => {
      const res = await getNavbarNotificationsAction();
      if (res.success && res.data) {
        setUnreadCount(res.data.count);
        setNotifications(res.data.recent);
      }
    });
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: string, link: string | null) => {
    await markNotificationAsReadAction(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setIsOpen(false);

    if (link) {
      router.push(link);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsReadAction();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "LEAVE":
        return <Calendar className="w-3.5 h-3.5 text-amber-600" />;
      case "ATTENDANCE":
        return <Clock className="w-3.5 h-3.5 text-sky-600" />;
      case "PAYROLL":
        return <Receipt className="w-3.5 h-3.5 text-emerald-600" />;
      case "CONTRACT":
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
      case "PERFORMANCE":
        return <Award className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifikasi sistem"
        className="relative p-2 rounded-xl text-slate-600 hover:text-[#102E50] hover:bg-slate-100 transition-colors cursor-pointer outline-hidden"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#A8281C] text-white text-[10px] font-bold ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl bg-white shadow-2xl border border-slate-200/90 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/90 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-xs text-slate-900">
                Pusat Notifikasi
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#A8281C]/10 text-[#A8281C]">
                  {unreadCount} baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isPending}
                className="text-[11px] text-[#F2AF3E] hover:text-[#d49428] font-semibold cursor-pointer transition-colors disabled:opacity-50"
              >
                Tandai Semua Dibaca
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium text-slate-600">Tidak ada notifikasi baru</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Semua tugas Anda telah selesai</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id, n.link)}
                  className={`p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-start gap-3 group ${
                    !n.isRead ? "bg-amber-50/20" : ""
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-white shadow-2xs">
                    {getCategoryIcon(n.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#A8281C] shrink-0 mt-1.5 ring-2 ring-rose-100" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              href="/notifikasi"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102E50] hover:text-[#1a4473] py-1 px-3 rounded-lg hover:bg-slate-200/50 transition-colors"
            >
              <span>Lihat Semua Notifikasi</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
