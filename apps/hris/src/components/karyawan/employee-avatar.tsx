"use client";

import React, { useState } from "react";

export interface EmployeeAvatarProps {
  photoKey?: string | null;
  avatarUrl?: string | null;
  name: string;
  gender?: string | null;
  className?: string;
  sizeClassName?: string;
  textClassName?: string;
  roundedClassName?: string;
}

export function EmployeeAvatar({
  photoKey,
  avatarUrl,
  name,
  gender,
  className = "",
  sizeClassName = "w-20 h-20 sm:w-24 sm:h-24",
  textClassName = "text-2xl sm:text-3xl",
  roundedClassName = "rounded-2xl",
}: EmployeeAvatarProps) {
  const [photoError, setPhotoError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  // Dapatkan URL foto profil asli jika ada
  const customPhotoSrc = avatarUrl || (photoKey ? `/api/documents/${photoKey}` : null);

  // Fallback avatar ilustrasi gender resmi PSPK
  const isFemale =
    gender?.toUpperCase() === "FEMALE" ||
    gender?.toLowerCase() === "perempuan" ||
    gender?.toLowerCase() === "wanita";
  const genderAvatarSrc = isFemale ? "/images/Avatar_Wanita.jpg" : "/images/Avatar_Pria.jpg";

  // Inisial nama jika gambar gagal dimuat semua
  const initial =
    (name || "Pegawai")
      .split(" ")
      .map((word) => word[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "P";

  // 1. Tampilkan foto kustom jika ada dan belum error
  if (customPhotoSrc && !photoError) {
    return (
      <div
        className={`relative ${sizeClassName} ${roundedClassName} overflow-hidden ring-1 ring-slate-200 shadow-sm shrink-0 bg-slate-100 ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={customPhotoSrc}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setPhotoError(true)}
        />
      </div>
    );
  }

  // 2. Tampilkan avatar resmi gender jika foto kustom tidak ada atau error
  if (!fallbackError) {
    return (
      <div
        className={`relative ${sizeClassName} ${roundedClassName} overflow-hidden ring-1 ring-slate-200/80 shadow-xs shrink-0 bg-slate-100 ${className}`}
        title={`${name} (${isFemale ? "Perempuan" : "Laki-laki"})`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={genderAvatarSrc}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setFallbackError(true)}
        />
      </div>
    );
  }

  // 3. Fallback inisial jika berkas gambar di server tidak dapat diakses
  return (
    <div
      className={`${sizeClassName} ${roundedClassName} bg-[#102E50]/10 text-[#102E50] font-bold ${textClassName} font-heading flex items-center justify-center border border-[#102E50]/20 shadow-xs shrink-0 select-none ${className}`}
      title={name}
    >
      {initial}
    </div>
  );
}
