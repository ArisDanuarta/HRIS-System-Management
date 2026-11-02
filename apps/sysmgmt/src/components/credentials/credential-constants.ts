import { CredentialCategory, TwoFactorType } from "@pspk/db";
import {
  Globe,
  Share2,
  Layers,
  Mail,
  MessageSquare,
  CreditCard,
  Landmark,
  Folder,
  ShieldOff,
  Smartphone,
  KeyRound,
  FileText,
} from "lucide-react";

export interface CategoryMeta {
  label: string;
  badgeClass: string;
  iconBgClass: string;
  iconTextClass: string;
  icon: typeof Globe;
  description: string;
}

export const CATEGORY_META: Record<CredentialCategory, CategoryMeta> = {
  WEBSITE_HOSTING: {
    label: "Website & Hosting",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    iconBgClass: "bg-sky-50",
    iconTextClass: "text-sky-600",
    icon: Globe,
    description: "Domain, cPanel, Cloudflare, VPS, hosting portal",
  },
  SOCIAL_MEDIA: {
    label: "Media Sosial",
    badgeClass: "bg-pink-50 text-pink-700 border-pink-200",
    iconBgClass: "bg-pink-50",
    iconTextClass: "text-pink-600",
    icon: Share2,
    description: "Instagram, YouTube, LinkedIn, Twitter/X, TikTok",
  },
  SAAS_TOOL: {
    label: "SaaS & Produktivitas",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    iconBgClass: "bg-indigo-50",
    iconTextClass: "text-indigo-600",
    icon: Layers,
    description: "Notion, Canva, Figma, Zoom, 1Password, Typeform",
  },
  EMAIL_SERVICE: {
    label: "Layanan Email",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    iconBgClass: "bg-amber-50",
    iconTextClass: "text-amber-600",
    icon: Mail,
    description: "Google Workspace Admin, Mailchimp, SendGrid",
  },
  FINANCE_BANKING: {
    label: "Perbankan & Keuangan",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
    iconBgClass: "bg-emerald-50",
    iconTextClass: "text-emerald-700",
    icon: CreditCard,
    description: "Internet Banking Bisnis, Midtrans, Xendit, PayPal",
  },
  GOVERNMENT_PUBLIC: {
    label: "Portal Instansi / Pajak",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    iconBgClass: "bg-blue-50",
    iconTextClass: "text-blue-600",
    icon: Landmark,
    description: "DJP Online, BPJS Ketenagakerjaan/Kesehatan, Kemendikbud",
  },
  OTHER: {
    label: "Lainnya",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    iconBgClass: "bg-slate-100",
    iconTextClass: "text-slate-600",
    icon: Folder,
    description: "Layanan umum & akun operasional lembaga lainnya",
  },
};

export interface TwoFactorMeta {
  label: string;
  shortLabel: string;
  badgeClass: string;
  icon: typeof ShieldOff;
}

export const TWO_FACTOR_META: Record<TwoFactorType, TwoFactorMeta> = {
  NONE: {
    label: "Tanpa 2FA",
    shortLabel: "Non-2FA",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    icon: ShieldOff,
  },
  AUTHENTICATOR_APP: {
    label: "Aplikasi Authenticator (TOTP)",
    shortLabel: "TOTP App",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: Smartphone,
  },
  SMS_OTP: {
    label: "SMS OTP",
    shortLabel: "SMS OTP",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    icon: MessageSquare,
  },
  EMAIL_OTP: {
    label: "Email OTP",
    shortLabel: "Email OTP",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Mail,
  },
  HARDWARE_KEY: {
    label: "Hardware Key (FIDO / YubiKey)",
    shortLabel: "Hardware Key",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    icon: KeyRound,
  },
  OTHER: {
    label: "Metode Lainnya (Kode Cadangan / Recovery)",
    shortLabel: "2FA Lainnya",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: FileText,
  },
};

/**
 * Generate a cryptographically strong random password
 */
export function generateStrongPassword(length = 18): string {
  const lowercase = "abcdefghjkmnpqrstuvwxyz";
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const symbols = "!@#$%^&*-_+=";

  const allChars = lowercase + uppercase + numbers + symbols;
  const result: string[] = [];

  // Pastikan minimal 1 karakter dari masing-masing set agar kuat
  result.push(lowercase[Math.floor(Math.random() * lowercase.length)]!);
  result.push(uppercase[Math.floor(Math.random() * uppercase.length)]!);
  result.push(numbers[Math.floor(Math.random() * numbers.length)]!);
  result.push(symbols[Math.floor(Math.random() * symbols.length)]!);

  for (let i = 4; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    result.push(allChars[randomIndex]!);
  }

  // Acak urutan karakter
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }

  return result.join("");
}

export interface PasswordStrengthResult {
  score: 1 | 2 | 3 | 4;
  label: string;
  colorClass: string;
  barWidthClass: string;
}

/**
 * Evaluate password strength
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password || password.length === 0) {
    return {
      score: 1,
      label: "Belum diisi",
      colorClass: "bg-slate-200 text-slate-500",
      barWidthClass: "w-0",
    };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 0.5;
  if (/[^A-Za-z0-9]/.test(password)) score += 0.5;

  if (score >= 4) {
    return {
      score: 4,
      label: "Sangat Kuat",
      colorClass: "bg-emerald-500 text-emerald-700",
      barWidthClass: "w-full bg-emerald-500",
    };
  } else if (score >= 3) {
    return {
      score: 3,
      label: "Kuat",
      colorClass: "bg-blue-500 text-blue-700",
      barWidthClass: "w-3/4 bg-blue-500",
    };
  } else if (score >= 2) {
    return {
      score: 2,
      label: "Sedang",
      colorClass: "bg-amber-500 text-amber-700",
      barWidthClass: "w-1/2 bg-amber-500",
    };
  } else {
    return {
      score: 1,
      label: "Lemah",
      colorClass: "bg-rose-500 text-rose-700",
      barWidthClass: "w-1/4 bg-rose-500",
    };
  }
}
