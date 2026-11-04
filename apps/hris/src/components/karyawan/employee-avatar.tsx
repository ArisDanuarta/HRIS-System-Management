"use client";

import React, { useState } from "react";

export interface EmployeeAvatarProps {
  photoKey?: string | null;
  avatarUrl?: string | null;
  name: string;
  className?: string;
  sizeClassName?: string;
  textClassName?: string;
  roundedClassName?: string;
}

export function EmployeeAvatar({
  photoKey,
  avatarUrl,
  name,
  className = "",
  sizeClassName = "w-20 h-20 sm:w-24 sm:h-24",
  textClassName = "text-2xl sm:text-3xl",
  roundedClassName = "rounded-2xl",
}: EmployeeAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Dapatkan URL gambar sumber
  const imageSrc = avatarUrl || (photoKey ? `/api/documents/${photoKey}` : null);

  // Inisial nama untuk fallback
  const initial = (name || "Pegawai")
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "P";

  if (imageSrc && !hasError) {
    return (
      <div
        className={`relative ${sizeClassName} ${roundedClassName} overflow-hidden ring-1 ring-slate-200 shadow-sm shrink-0 bg-slate-100 ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClassName} ${roundedClassName} bg-[#102E50]/10 text-[#102E50] font-bold ${textClassName} font-heading flex items-center justify-center border border-[#102E50]/20 shadow-xs shrink-0 select-none ${className}`}
      title={name}
    >
      {initial}
    </div>
  );
}

