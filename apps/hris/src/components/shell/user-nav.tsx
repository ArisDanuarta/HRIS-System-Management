"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, ShieldCheck, KeyRound, ChevronDown, ArrowLeftRight, ExternalLink } from "lucide-react";
import { authClient } from "@pspk/auth/client";

export interface UserNavProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    roleName?: string;
  };
}

export function UserNav({ user }: UserNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut();
    } catch {
      // ignore
    }
    router.push("/login");
    router.refresh();
  };

  const initial = user.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-[#eff4ff] transition-colors cursor-pointer group text-left"
        aria-expanded={isOpen}
      >
        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#102e50] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 overflow-hidden">
          {user.image ? (
            <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span>{initial}</span>
          )}
        </div>

        {/* User Details (Desktop) */}
        <div className="hidden md:flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-[#121c2a] group-hover:text-[#102e50] transition-colors leading-tight">
              {user.name}
            </span>
            <span className="bg-[#dee9fc] text-[#102e50] text-[10px] px-1.5 py-0.5 rounded font-bold leading-none">
              {user.roleName || "Staff"}
            </span>
          </div>
          <span className="text-[11px] text-[#74777f] leading-tight truncate max-w-[160px]">
            {user.email}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-[#74777f] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-[#dee9fc] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User Header */}
          <div className="px-3 py-2.5 border-b border-[#dee9fc]">
            <p className="text-xs font-bold text-[#102e50] leading-tight">{user.name}</p>
            <p className="text-[11px] text-[#74777f] truncate mt-0.5">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#f2af3e]" />
              <span className="text-[10px] font-semibold text-[#805600] uppercase tracking-wider">
                {user.roleName || "Staff PSPK"}
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="py-1">
            <a
              href="/profil"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#43474e] hover:bg-[#eff4ff] hover:text-[#102e50] transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4 text-[#74777f]" />
              <span>Profil Saya & Berkas</span>
            </a>

            <a
              href="/profil#keamanan"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#43474e] hover:bg-[#eff4ff] hover:text-[#102e50] transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              <KeyRound className="w-4 h-4 text-[#74777f]" />
              <span>Ganti Kata Sandi</span>
            </a>

            <a
              href="http://localhost:3002"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-[#43474e] hover:bg-[#eff4ff] hover:text-[#102e50] transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-2.5">
                <ArrowLeftRight className="w-4 h-4 text-[#74777f]" />
                <span>System Management</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#74777f]" />
            </a>
          </div>

          {/* Sign Out Button */}
          <div className="pt-1 border-t border-[#dee9fc]">
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#ba1a1a] hover:bg-[#ffdad6]/60 transition-colors font-semibold cursor-pointer disabled:opacity-60"
            >
              <LogOut className="w-4 h-4 text-[#ba1a1a]" />
              <span>{isLoggingOut ? "Keluar..." : "Keluar dari Sistem"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
