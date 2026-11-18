import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { formatDate, formatRupiah } from "@pspk/shared";
import { getStorageProvider } from "@pspk/storage";
import { getPtkpExplanation, getTaxMethodExplanation } from "../tax-explanation";

export interface PdfAddressItem {
  type: string;
  street?: string | null;
  kelurahan?: string | null;
  kecamatan?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
}

export interface PdfFamilyItem {
  name: string;
  relation: string;
  birthDate?: Date | string | null;
  phone?: string | null;
  isDependent: boolean;
}

export interface PdfEducationItem {
  level: string;
  institution: string;
  major?: string | null;
  graduationYear?: number | null;
  gpa?: unknown;
}

export interface PdfTrainingItem {
  name: string;
  organizer?: string | null;
  startDate?: Date | string | null;
  duration?: string | null;
}

export interface PdfWorkExperienceItem {
  companyName: string;
  jobTitle: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  reasonForLeaving?: string | null;
}

export interface PdfContractItem {
  type: string;
  wageType?: string | null;
  baseSalary?: unknown;
  hourlyRate?: unknown;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  status: string;
  notes?: string | null;
  employmentTypeMaster?: { name: string } | null;
}

export interface PdfDocumentItem {
  category: string;
  title: string;
  fileName: string;
  createdAt?: Date | string | null;
}

export interface PdfEmployeeData {
  id: string;
  employeeNo: string;
  fullName: string;
  nickname?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  birthPlace?: string | null;
  birthDate?: Date | string | null;
  religion?: string | null;
  bloodType?: string | null;
  citizenship?: string | null;
  workEmail?: string | null;
  personalEmail?: string | null;
  phone?: string | null;
  landlinePhone?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactPhone?: string | null;
  joinDate: Date | string;
  probationEndDate?: Date | string | null;
  status: string;
  photoKey?: string | null;
  address?: string | null;
  ptkpStatus?: string | null;
  taxMethod?: string | null;
  nikRaw?: string | null;
  npwpRaw?: string | null;
  bankAccountRaw?: string | null;
  nikMasked?: string | null;
  npwpMasked?: string | null;
  bankAccountMasked?: string | null;
  bankName?: string | null;
  currentPosition?: { title: string } | null;
  currentDepartment?: { name: string } | null;
  manager?: { fullName: string; employeeNo: string; currentPosition?: { title: string } | null } | null;
  workLocation?: { name: string } | null;
  legalEntity?: { name: string } | null;
  addresses?: PdfAddressItem[];
  familyMembers?: PdfFamilyItem[];
  educations?: PdfEducationItem[];
  trainings?: PdfTrainingItem[];
  workExperiences?: PdfWorkExperienceItem[];
  contracts?: PdfContractItem[];
  salaryComponents?: Array<{ name: string; amount: number; code?: string }>;
  documents?: PdfDocumentItem[];
}

export interface EmployeePdfExportOptions {
  employee: PdfEmployeeData;
  actor: {
    name: string;
    email: string;
    role: string;
  };
  options: {
    personal: boolean;
    address: boolean;
    family: boolean;
    education: boolean;
    employment: boolean;
    contracts: boolean;
    attendance: boolean;
    documents: boolean;
    assets: boolean;
    sensitive: boolean;
    compensation: boolean;
    attendanceFrom?: string;
    attendanceTo?: string;
  };
  attendanceData?: {
    summary: {
      workingDaysCount: number;
      presentCount: number;
      lateCount: number;
      wfhCount: number;
      leaveCount: number;
      absentCount: number;
      attendanceRate: number;
    };
    records: Array<{
      date: Date | string;
      checkInTime?: Date | string | null;
      checkOutTime?: Date | string | null;
      status: string;
      notes?: string | null;
    }>;
    leaveBalances: Array<{
      leaveTypeName: string;
      quotaDays: number;
      usedDays: number;
      remainingDays: number;
    }>;
  };
  activeAssets?: Array<{
    assetTag: string;
    name: string;
    brand?: string | null;
    model?: string | null;
    assignedAt: Date | string;
    conditionOut: string;
  }>;
}

// ===========================================================================
// KONSTANTA LAYOUT
// ===========================================================================
const PAGE_W = 595.28;
const MARGIN = 36;
const CONTENT_W = 523;
const TOP = 72; // awal area konten (di bawah kop)
const BOTTOM = 794; // batas bawah area konten (di atas footer)
const SECTION_H = 20;
const CITY = "Jakarta"; // kota pada lembar pengesahan

// Palet warna resmi PSPK
const COLORS = {
  navy: "#102E50",
  navyLight: "#1E4775",
  gold: "#F2AF3E",
  maroon: "#A8281C",
  slateDark: "#1E293B",
  slateMedium: "#475569",
  slateLight: "#64748B",
  border: "#CBD5E1",
  borderLight: "#E2E8F0",
  bgZebra: "#F8FAFC",
  rowAlt: "#F1F5F9",
  tint: "#E6EDF5",
  bgHeader: "#102E50",
  white: "#FFFFFF",
  emerald: "#047857",
  amber: "#B45309",
  amberBg: "#FEF3C7",
  amberText: "#92400E",
};

// ===========================================================================
// HELPER UMUM
// ===========================================================================
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function resolveImagePath(filename: string): string | null {
  const candidates = [
    path.join(process.cwd(), "apps/hris/public/images", filename),
    path.join(process.cwd(), "public/images", filename),
    path.join(__dirname, "../../../../../apps/hris/public/images", filename),
    path.join(__dirname, "../../../../public/images", filename),
  ];
  for (const c of candidates) {
    if (fs.existsSync(/*turbopackIgnore: true*/ c)) return c;
  }
  return null;
}

const dash = (v?: string | number | null): string => {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s ? s : "-";
};

const fmtTime = (v?: Date | string | null): string =>
  v ? new Date(v).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-";

const ageFrom = (d?: Date | string | null): number | null => {
  if (!d) return null;
  const b = new Date(d);
  if (Number.isNaN(b.getTime())) return null;
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  const m = n.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < b.getDate())) a--;
  return a >= 0 ? a : null;
};

const formatTenureText = (joinDate: Date | string): string => {
  const start = new Date(joinDate);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months--;
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years <= 0 && months <= 0) return "< 1 Bulan";
  if (years <= 0) return `${months} Bulan`;
  return `${years} Tahun ${months} Bulan`;
};

/** Merapikan catatan presensi: buang tag [WITA], ubah [Out: ...] dst. jadi teks biasa */
const cleanAttendanceNote = (raw?: string | null): string => {
  if (!raw) return "-";
  const s = raw
    .replace(/\[(WITA|WIB|WIT)\]/g, "")
    .replace(/\[Out:\s*([^\]]*?)\s*\]/g, (_m, t: string) => (t.trim() ? `Pulang: ${t.trim()}` : ""))
    .replace(/\[Auto-Out HR:\s*([^\]]*?)\s*\]/g, (_m, t: string) => `Auto-out HR ${t.trim()}`)
    .replace(/\[WFH\]/g, "WFH")
    .replace(/\|/g, " · ")
    .replace(/\s+/g, " ")
    .replace(/^[·\s]+|[·\s]+$/g, "")
    .trim();
  return s || "-";
};

const stripBrackets = (raw?: string | null): string => {
  if (!raw) return "-";
  const s = raw.trim().replace(/^\[(.*)\]$/, "$1").trim();
  return s || "-";
};

const EMPLOYEE_STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  ACTIVE: { label: "AKTIF", bg: "#D1FAE5", fg: "#047857" },
  PROBATION: { label: "PROBATION", bg: "#FEF3C7", fg: "#92400E" },
  TERMINATED: { label: "NONAKTIF", bg: "#FEE2E2", fg: "#A8281C" },
  RESIGNED: { label: "RESIGN", bg: "#FEE2E2", fg: "#A8281C" },
};

const ATTENDANCE_STATUS: Record<string, { label: string; color: string }> = {
  PRESENT: { label: "Hadir", color: COLORS.emerald },
  LATE: { label: "Terlambat", color: COLORS.amber },
  WFH: { label: "WFH", color: COLORS.navyLight },
  ABSENT: { label: "Alpa", color: COLORS.maroon },
  LEAVE: { label: "Cuti", color: "#6D28D9" },
};

const CONTRACT_STATUS_COLOR: Record<string, string> = {
  ACTIVE: COLORS.emerald,
  RENEWED: COLORS.slateMedium,
  EXPIRED: COLORS.maroon,
  TERMINATED: COLORS.maroon,
};

interface Col<T> {
  header: string;
  width: number; // bobot relatif, otomatis diskalakan ke lebar konten
  align?: "left" | "center" | "right";
  value: (row: T, index: number) => string;
  color?: (row: T) => string | undefined;
  bold?: boolean;
}

/**
 * Menghasilkan Dokumen PDF Rekam Kepegawaian 360° Resmi PSPK
 */
export async function generateEmployeeProfilePdf(
  data: EmployeePdfExportOptions,
): Promise<Buffer> {
  const { employee, actor, options, attendanceData, activeAssets = [] } = data;

  const doc = new PDFDocument({
    size: "A4",
    margin: MARGIN,
    bufferPages: true,
    info: {
      Title: `Dokumen Rekam Kepegawaian - ${employee.fullName}`,
      Author: "PSPK HRIS",
      Subject: "Dokumen Rekam Kepegawaian 360°",
    },
  });

  const buffers: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => buffers.push(chunk));
  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err: Error) => reject(err));
  });

  // -------------------------------------------------------------------------
  // Aset gambar
  // -------------------------------------------------------------------------
  const logoPath = resolveImagePath("logo_pspk_horizontal.png");
  const iconPath = resolveImagePath("icon_pspk.jpg");

  let photoBuffer: Buffer | null = null;
  if (employee.photoKey) {
    try {
      const storage = getStorageProvider();
      const raw = await storage.get(employee.photoKey);
      if (raw && raw.stream) {
        photoBuffer = await streamToBuffer(raw.stream);
      }
    } catch (err) {
      console.warn("Gagal membaca foto profil dari storage:", err);
    }
  }

  if (!photoBuffer) {
    const g = employee.gender?.toLowerCase();
    const isFemale = g === "female" || g === "perempuan" || g === "wanita";
    const avatarPath = resolveImagePath(isFemale ? "Avatar_Wanita.jpg" : "Avatar_Pria.jpg");
    if (avatarPath) {
      photoBuffer = fs.readFileSync(/*turbopackIgnore: true*/ avatarPath);
    }
  }

  // -------------------------------------------------------------------------
  // Primitif gambar
  // -------------------------------------------------------------------------
  let y = TOP;

  const hLine = (yy: number, color = COLORS.borderLight, w = 0.5, x1 = MARGIN, x2 = MARGIN + CONTENT_W) => {
    doc.save().strokeColor(color).lineWidth(w).moveTo(x1, yy).lineTo(x2, yy).stroke().restore();
  };

  const tintRect = (x: number, yy: number, w: number, h: number, color: string, opacity = 0.7) => {
    doc.save();
    doc.fillOpacity(opacity);
    doc.rect(x, yy, w, h).fill(color);
    doc.restore();
  };

  const textH = (text: string, width: number, font: string, size: number, lineGap = 1): number => {
    doc.font(font).fontSize(size);
    return doc.heightOfString(text, { width, lineGap });
  };

  const pill = (text: string, x: number, yy: number, w: number, bg: string, fg: string) => {
    doc.save();
    doc.roundedRect(x, yy, w, 14, 7).fill(bg);
    doc.restore();
    doc.fillColor(fg).font("Helvetica-Bold").fontSize(7).text(text, x, yy + 3.7, {
      width: w,
      align: "center",
      lineBreak: false,
    });
  };

  // Kop halaman + watermark (digambar otomatis setiap halaman baru, di BAWAH konten)
  const drawPageChrome = () => {
    if (iconPath) {
      doc.save();
      doc.opacity(0.06);
      doc.image(iconPath, (PAGE_W - 240) / 2, 300, { width: 240 });
      doc.restore();
    }

    if (employee.status === "TERMINATED" || employee.status === "RESIGNED") {
      doc.save();
      doc.opacity(0.12);
      doc.rotate(-30, { origin: [297, 420] });
      doc.fillColor(COLORS.maroon).fontSize(38).font("Helvetica-Bold");
      doc.text("STATUS: NONAKTIF / TERMINATED", 60, 410, { align: "center", width: 480, lineBreak: false });
      doc.restore();
    }

    if (logoPath) {
      doc.image(logoPath, MARGIN, 24, { width: 130 });
    } else {
      doc.fillColor(COLORS.navy).fontSize(14).font("Helvetica-Bold").text("PSPK", MARGIN, 26, { lineBreak: false });
    }

    doc
      .fillColor(COLORS.navy)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("DOKUMEN REKAM KEPEGAWAIAN 360°", 200, 25, { align: "right", width: 359, lineBreak: false });
    doc
      .fillColor(COLORS.slateMedium)
      .fontSize(7.5)
      .font("Helvetica")
      .text("Pusat Studi Pendidikan dan Kebijakan (PSPK)", 200, 39, { align: "right", width: 359, lineBreak: false });

    hLine(54, COLORS.navy, 1.5);
    hLine(57, COLORS.gold, 1);
  };

  doc.on("pageAdded", drawPageChrome);
  drawPageChrome();

  // -------------------------------------------------------------------------
  // Manajemen halaman
  // -------------------------------------------------------------------------
  const newPage = () => {
    doc.addPage(); // kop digambar lewat event pageAdded
    y = TOP;
  };

  const ensureSpace = (h: number) => {
    if (y + h > BOTTOM) newPage();
  };

  let secNo = 0;
  const section = (title: string, opts: { subtitle?: string; follow?: number } = {}) => {
    if (y > TOP) y += 8;
    ensureSpace(SECTION_H + (opts.follow ?? 46));
    secNo += 1;
    doc.rect(MARGIN, y, CONTENT_W, SECTION_H).fill(COLORS.navy);
    doc.rect(MARGIN, y, 4, SECTION_H).fill(COLORS.gold);
    doc
      .fillColor(COLORS.white)
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text(`${secNo}. ${title.toUpperCase()}`, MARGIN + 14, y + 6.2, { width: CONTENT_W - 28, lineBreak: false });
    if (opts.subtitle) {
      doc
        .fillColor(COLORS.gold)
        .font("Helvetica")
        .fontSize(7.5)
        .text(opts.subtitle, MARGIN + 14, y + 6.8, { width: CONTENT_W - 28, align: "right", lineBreak: false });
    }
    y += SECTION_H + 6;
  };

  const notice = (text: string) => {
    ensureSpace(26);
    tintRect(MARGIN, y, CONTENT_W, 22, COLORS.amberBg, 0.8);
    doc.rect(MARGIN, y, 3, 22).fill(COLORS.gold);
    doc
      .fillColor(COLORS.amberText)
      .font("Helvetica-Oblique")
      .fontSize(7.5)
      .text(text, MARGIN + 12, y + 7, { width: CONTENT_W - 20, lineBreak: false });
    y += 28;
  };

  const caption = (text: string) => {
    ensureSpace(14);
    doc.fillColor(COLORS.slateLight).font("Helvetica-Oblique").fontSize(7).text(text, MARGIN, y, {
      width: CONTENT_W,
      lineBreak: false,
    });
    y += 14;
  };

  /** Grid label–nilai. Tinggi baris menyesuaikan teks terpanjang sehingga tidak saling tumpuk. */
  const kvGrid = (items: Array<{ label: string; value: string }>, perRow: 1 | 2 = 2) => {
    const colW = CONTENT_W / perRow;
    const labelW = perRow === 1 ? 110 : 86;
    const valueW = colW - labelW - 18;

    for (let i = 0; i < items.length; i += perRow) {
      const cells = items.slice(i, i + perRow);
      const heights = cells.flatMap((c) => [
        textH(dash(c.value), valueW, "Helvetica", 8),
        textH(c.label, labelW - 4, "Helvetica-Bold", 7.2),
      ]);
      const rowH = Math.max(20, Math.max(...heights) + 11);
      ensureSpace(rowH);

      if ((i / perRow) % 2 === 1) tintRect(MARGIN, y, CONTENT_W, rowH, COLORS.rowAlt, 0.7);

      cells.forEach((c, j) => {
        const x = MARGIN + j * colW + 8;
        doc
          .fillColor(COLORS.slateLight)
          .font("Helvetica-Bold")
          .fontSize(7.2)
          .text(c.label, x, y + 6, { width: labelW - 4, lineGap: 1 });
        doc
          .fillColor(COLORS.slateDark)
          .font("Helvetica")
          .fontSize(8)
          .text(dash(c.value), x + labelW, y + 5.5, { width: valueW, lineGap: 1 });
      });

      hLine(y + rowH);
      y += rowH;
    }
    y += 6;
  };

  /** Tabel dengan tinggi baris dinamis + header berulang di halaman berikutnya. */
  function drawTable<T>(cols: Col<T>[], rows: T[], emptyText: string) {
    const PX = 6;
    const PY = 5;
    const total = cols.reduce((a, c) => a + c.width, 0);
    const ws = cols.map((c) => (c.width / total) * CONTENT_W);
    const xs: number[] = [];
    let acc = MARGIN;
    ws.forEach((w) => {
      xs.push(acc);
      acc += w;
    });

    const headH =
      Math.max(
        ...cols.map((c, i) => textH(c.header, (ws[i] ?? 60) - PX * 2, "Helvetica-Bold", 7.2)),
      ) +
      PY * 2;

    const drawHead = () => {
      doc.rect(MARGIN, y, CONTENT_W, headH).fill(COLORS.tint);
      hLine(y + headH, COLORS.navy, 1);
      cols.forEach((c, i) => {
        doc
          .fillColor(COLORS.navy)
          .font("Helvetica-Bold")
          .fontSize(7.2)
          .text(c.header, (xs[i] ?? MARGIN) + PX, y + PY, {
            width: (ws[i] ?? 60) - PX * 2,
            align: c.align ?? "left",
            lineGap: 1,
          });
      });
      y += headH;
    };

    const rowHeight = (r: T, idx: number) =>
      Math.max(
        20,
        Math.max(
          ...cols.map((c, ci) =>
            textH(c.value(r, idx), (ws[ci] ?? 60) - PX * 2, c.bold ? "Helvetica-Bold" : "Helvetica", 7.5),
          ),
        ) +
          PY * 2,
      );

    if (rows.length === 0) {
      ensureSpace(headH + 26);
      drawHead();
      tintRect(MARGIN, y, CONTENT_W, 22, COLORS.rowAlt, 0.7);
      doc
        .fillColor(COLORS.slateMedium)
        .font("Helvetica-Oblique")
        .fontSize(7.5)
        .text(emptyText, MARGIN + PX + 2, y + 7, { width: CONTENT_W - 20, lineBreak: false });
      hLine(y + 22);
      y += 30;
      return;
    }

    ensureSpace(headH + rowHeight(rows[0]!, 0));
    drawHead();

    rows.forEach((r, idx) => {
      const h = rowHeight(r, idx);
      if (y + h > BOTTOM) {
        newPage();
        drawHead();
      }
      if (idx % 2 === 1) tintRect(MARGIN, y, CONTENT_W, h, COLORS.rowAlt, 0.7);
      cols.forEach((c, ci) => {
        doc
          .fillColor(c.color?.(r) ?? COLORS.slateDark)
          .font(c.bold ? "Helvetica-Bold" : "Helvetica")
          .fontSize(7.5)
          .text(c.value(r, idx), (xs[ci] ?? MARGIN) + PX, y + PY, {
            width: (ws[ci] ?? 60) - PX * 2,
            align: c.align ?? "left",
            lineGap: 1,
          });
      });
      hLine(y + h);
      y += h;
    });
    y += 8;
  }

  // ===========================================================================
  // KARTU IDENTITAS UTAMA
  // ===========================================================================
  {
    const px = MARGIN + 12;
    const py = y + 12;
    const pw = 84;
    const ph = 106;
    const tx = px + pw + 16;
    const tw = MARGIN + CONTENT_W - 12 - tx;

    const st = EMPLOYEE_STATUS[employee.status?.toUpperCase()] ?? {
      label: dash(employee.status).toUpperCase(),
      bg: COLORS.tint,
      fg: COLORS.navy,
    };
    const badgeW = 68;
    const nameW = tw - badgeW - 10;
    const nameH = textH(dash(employee.fullName), nameW, "Helvetica-Bold", 15, 0);

    let cy = y + 14 + nameH + 3;
    const nickY = cy;
    if (employee.nickname) cy += 12;
    cy += 3;
    const lineY = cy;
    cy += 9;
    const gridY = cy;
    const ROW = 35;
    const gridBottom = gridY + ROW * 3;
    const cardH = Math.max(ph + 24, gridBottom - y + 2);

    // Bingkai kartu
    doc.save().roundedRect(MARGIN, y, CONTENT_W, cardH, 6).lineWidth(1).strokeColor(COLORS.border).stroke().restore();
    doc.save().rect(MARGIN + 6, y, CONTENT_W - 12, 2.5).fill(COLORS.gold).restore();

    // Pasfoto
    let photoDrawn = false;
    if (photoBuffer) {
      try {
        doc.save();
        doc.roundedRect(px, py, pw, ph, 4).clip();
        doc.image(photoBuffer, px, py, { cover: [pw, ph], align: "center", valign: "center" });
        doc.restore();
        photoDrawn = true;
      } catch {
        doc.restore();
      }
    }
    if (!photoDrawn) {
      doc.save().roundedRect(px, py, pw, ph, 4).fill(COLORS.rowAlt).restore();
      doc
        .fillColor(COLORS.slateMedium)
        .font("Helvetica")
        .fontSize(8)
        .text("Foto Pegawai", px, py + ph / 2 - 4, { width: pw, align: "center", lineBreak: false });
    }
    doc.save().roundedRect(px, py, pw, ph, 4).lineWidth(1).strokeColor(COLORS.navyLight).stroke().restore();

    // Nama + status
    doc
      .fillColor(COLORS.navy)
      .font("Helvetica-Bold")
      .fontSize(15)
      .text(dash(employee.fullName), tx, y + 14, { width: nameW, lineGap: 0 });
    pill(st.label, tx + tw - badgeW, y + 16, badgeW, st.bg, st.fg);

    if (employee.nickname) {
      doc
        .fillColor(COLORS.slateMedium)
        .font("Helvetica-Oblique")
        .fontSize(8)
        .text(`Panggilan: "${employee.nickname}"`, tx, nickY, { width: tw, lineBreak: false });
    }

    hLine(lineY, COLORS.borderLight, 0.5, tx, tx + tw);

    const summaryItems = [
      { label: "Nomor Induk Pegawai", value: dash(employee.employeeNo) },
      { label: "Jabatan Utama", value: employee.currentPosition?.title || "Belum ada jabatan" },
      { label: "Divisi / Unit Kerja", value: employee.currentDepartment?.name || "Belum ada divisi" },
      { label: "Tanggal Bergabung", value: formatDate(employee.joinDate) },
      { label: "Masa Kerja", value: formatTenureText(employee.joinDate) },
      { label: "Atasan Langsung", value: employee.manager?.fullName || "-" },
    ];
    const colW2 = tw / 2;
    summaryItems.forEach((it, idx) => {
      const x = tx + (idx % 2) * colW2;
      const yy = gridY + Math.floor(idx / 2) * ROW;
      doc
        .fillColor(COLORS.slateLight)
        .font("Helvetica-Bold")
        .fontSize(6.5)
        .text(it.label.toUpperCase(), x, yy, { width: colW2 - 10, lineBreak: false });
      doc
        .fillColor(COLORS.slateDark)
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .text(it.value, x, yy + 9.5, { width: colW2 - 12, height: 21, ellipsis: true, lineGap: 0.5 });
    });

    y += cardH + 12;
  }

  // ===========================================================================
  // 1. DATA DIRI
  // ===========================================================================
  if (options.personal) {
    section("Data Diri & Informasi Kontak Pegawai");
    const age = ageFrom(employee.birthDate);
    kvGrid([
      { label: "Jenis Kelamin", value: employee.gender === "FEMALE" ? "Perempuan" : employee.gender === "MALE" ? "Laki-laki" : "-" },
      { label: "Status Pernikahan", value: dash(employee.maritalStatus) },
      {
        label: "Tempat, Tgl Lahir",
        value: `${dash(employee.birthPlace)}, ${employee.birthDate ? formatDate(employee.birthDate) : "-"}${age !== null ? ` (${age} th)` : ""}`,
      },
      { label: "Agama", value: dash(employee.religion) },
      { label: "Golongan Darah", value: dash(employee.bloodType) },
      { label: "Kewarganegaraan", value: employee.citizenship || "WNI" },
      { label: "Email Kantor", value: dash(employee.workEmail) },
      { label: "Email Pribadi", value: dash(employee.personalEmail) },
      { label: "No. HP / WhatsApp", value: dash(employee.phone) },
      { label: "Telepon Rumah", value: dash(employee.landlinePhone) },
      {
        label: "Kontak Darurat",
        value: employee.emergencyContactName
          ? `${employee.emergencyContactName} (${employee.emergencyContactRelation || "Kerabat"})`
          : "-",
      },
      { label: "No. HP Darurat", value: dash(employee.emergencyContactPhone) },
    ]);
  }

  // ===========================================================================
  // 2. ALAMAT
  // ===========================================================================
  if (options.address) {
    section("Rincian Alamat (KTP & Domisili)", { follow: 44 });
    const ktpAddr = employee.addresses?.find((a) => a.type === "KTP");
    const domAddr = employee.addresses?.find((a) => a.type === "DOMICILE");

    const formatFullAddress = (addr?: PdfAddressItem): string => {
      if (!addr) return employee.address || "Belum dicantumkan";
      const parts = [
        addr.street,
        addr.kelurahan ? `Kel. ${addr.kelurahan}` : null,
        addr.kecamatan ? `Kec. ${addr.kecamatan}` : null,
        addr.city,
        addr.province,
      ].filter((p): p is string => !!p && !!p.trim());
      const base = parts.join(", ");
      const full = addr.postalCode ? `${base} ${addr.postalCode}` : base;
      return full || "Belum dicantumkan";
    };

    kvGrid(
      [
        { label: "Alamat Sesuai KTP", value: formatFullAddress(ktpAddr) },
        { label: "Alamat Domisili", value: formatFullAddress(domAddr) },
      ],
      1,
    );
  }

  // ===========================================================================
  // 3. KELUARGA
  // ===========================================================================
  if (options.family) {
    section("Susunan Anggota Keluarga & Tanggungan");
    drawTable(
      [
        { header: "No", width: 24, value: (_r, i) => String(i + 1) },
        { header: "Nama Anggota Keluarga", width: 150, value: (r) => dash(r.name) },
        { header: "Hubungan", width: 80, value: (r) => dash(r.relation) },
        {
          header: "Tgl Lahir / Usia",
          width: 115,
          value: (r) => {
            if (!r.birthDate) return "-";
            const a = ageFrom(r.birthDate);
            return `${formatDate(r.birthDate)}${a !== null ? ` (${a} th)` : ""}`;
          },
        },
        { header: "No. Telepon", width: 90, value: (r) => dash(r.phone) },
        {
          header: "Tanggungan",
          width: 64,
          align: "center",
          value: (r) => (r.isDependent ? "Ya" : "Tidak"),
          color: (r) => (r.isDependent ? COLORS.emerald : COLORS.slateLight),
        },
      ],
      employee.familyMembers || [],
      "Tidak ada data keluarga yang dicatatkan.",
    );
  }

  // ===========================================================================
  // 4–6. PENDIDIKAN, PELATIHAN, PENGALAMAN KERJA
  // ===========================================================================
  if (options.education) {
    section("Riwayat Pendidikan Formal");
    drawTable(
      [
        { header: "Jenjang", width: 60, value: (r) => dash(r.level) },
        { header: "Institusi / Universitas", width: 190, value: (r) => dash(r.institution) },
        { header: "Program Studi / Jurusan", width: 150, value: (r) => dash(r.major) },
        { header: "Tahun Lulus", width: 58, align: "center", value: (r) => dash(r.graduationYear) },
        {
          header: "IPK / Nilai",
          width: 55,
          align: "center",
          value: (r) => (r.gpa ? Number(String(r.gpa)).toFixed(2) : "-"),
        },
      ],
      employee.educations || [],
      "Belum ada riwayat pendidikan yang dicatatkan.",
    );

    section("Riwayat Pelatihan, Riset & Sertifikasi");
    drawTable(
      [
        { header: "Nama Pelatihan / Sertifikasi", width: 190, value: (r) => dash(r.name) },
        { header: "Lembaga Penyelenggara", width: 150, value: (r) => dash(r.organizer) },
        { header: "Periode / Tahun", width: 95, value: (r) => (r.startDate ? formatDate(r.startDate) : "-") },
        { header: "Durasi Jam", width: 88, align: "center", value: (r) => dash(r.duration) },
      ],
      employee.trainings || [],
      "Belum ada riwayat pelatihan yang dicatatkan.",
    );

    section("Riwayat Pengalaman Kerja Terdahulu");
    drawTable(
      [
        { header: "Perusahaan / Lembaga", width: 150, value: (r) => dash(r.companyName) },
        { header: "Posisi / Jabatan", width: 130, value: (r) => dash(r.jobTitle) },
        {
          header: "Periode Bekerja",
          width: 150,
          value: (r) =>
            `${r.startDate ? formatDate(r.startDate) : "-"} s.d. ${r.endDate ? formatDate(r.endDate) : "Sekarang"}`,
        },
        { header: "Alasan Berhenti", width: 93, value: (r) => dash(r.reasonForLeaving) },
      ],
      employee.workExperiences || [],
      "Belum ada riwayat pengalaman kerja yang dicatatkan.",
    );
  }

  // ===========================================================================
  // 7. PENEMPATAN
  // ===========================================================================
  if (options.employment) {
    section("Penempatan, Divisi & Jabatan");
    kvGrid([
      { label: "Divisi Saat Ini", value: dash(employee.currentDepartment?.name) },
      { label: "Jabatan Saat Ini", value: dash(employee.currentPosition?.title) },
      {
        label: "Atasan Langsung",
        value: employee.manager?.fullName
          ? `${employee.manager.fullName} (${employee.manager.employeeNo})`
          : "Direksi / Mandiri",
      },
      { label: "Lokasi Kantor", value: employee.workLocation?.name || "Kantor PSPK Jakarta" },
      { label: "Entitas Hukum", value: employee.legalEntity?.name || "Yayasan PSPK" },
      { label: "Akhir Probation", value: employee.probationEndDate ? formatDate(employee.probationEndDate) : "-" },
    ]);
  }

  // ===========================================================================
  // 8. KONTRAK
  // ===========================================================================
  if (options.contracts) {
    section("Riwayat Kontrak Kerja Pegawai (PKWT/SK)");
    drawTable(
      [
        { header: "Jenis Ikatan", width: 150, value: (r) => r.employmentTypeMaster?.name || r.type || "-" },
        { header: "Mulai Kontrak", width: 78, value: (r) => (r.startDate ? formatDate(r.startDate) : "-") },
        { header: "Akhir Kontrak", width: 78, value: (r) => (r.endDate ? formatDate(r.endDate) : "Tetap / -") },
        {
          header: "Status",
          width: 62,
          align: "center",
          bold: true,
          value: (r) => dash(r.status),
          color: (r) => CONTRACT_STATUS_COLOR[r.status?.toUpperCase()] ?? COLORS.slateDark,
        },
        { header: "Keterangan", width: 155, value: (r) => stripBrackets(r.notes) },
      ],
      employee.contracts || [],
      "Tidak ada riwayat kontrak.",
    );
  }

  // ===========================================================================
  // 9–10. KOMPENSASI & DATA SENSITIF
  // ===========================================================================
  if (options.employment || options.contracts || options.compensation || options.sensitive) {
    section("Struktur Kompensasi & Pajak Penghasilan (PPh 21)", { follow: 40 });
    if (!options.compensation) {
      notice("INFORMASI STRUKTUR KOMPENSASI DIKUNCI / TIDAK DISERTAKAN DALAM DOKUMEN INI");
    } else {
      const activeContract = employee.contracts?.find((c) => c.status === "ACTIVE") || employee.contracts?.[0];
      const isHourly = activeContract?.wageType === "HOURLY";
      const baseSalary = isHourly ? 0 : activeContract?.baseSalary ? Number(activeContract.baseSalary) : 0;
      const hourlyRate = activeContract?.hourlyRate ? Number(activeContract.hourlyRate) : 0;
      const totalAllowances = (employee.salaryComponents || []).reduce((acc: number, c) => acc + c.amount, 0);

      const ptkpInfo = getPtkpExplanation(employee.ptkpStatus);
      const taxMethodInfo = getTaxMethodExplanation(employee.taxMethod);

      kvGrid([
        { label: "Gaji Pokok", value: isHourly ? `${formatRupiah(hourlyRate)} / jam` : formatRupiah(baseSalary) },
        { label: "Total Tunjangan", value: formatRupiah(totalAllowances) },
        { label: "Estimasi Bruto", value: formatRupiah(baseSalary + totalAllowances) },
        { label: "Status PTKP & TER", value: `${employee.ptkpStatus || "TK/0"} (${ptkpInfo?.terCategory || "TER A"})` },
        { label: "Metode Pajak", value: `${employee.taxMethod || "GROSS"} (${taxMethodInfo?.badge || "-"})` },
        { label: "Iuran BPJS Kes (1%)", value: formatRupiah(Math.round(baseSalary * 0.01)) },
      ]);
    }

    section("Identitas Sensitif & Payroll Lembaga", { follow: 40 });
    if (!options.sensitive) {
      notice("DATA SENSITIF TERENKRIPSI (NIK, NPWP, BANK) DILINDUNGI & TIDAK DIBUKA");
    } else {
      kvGrid([
        { label: "NIK", value: employee.nikRaw || employee.nikMasked || "-" },
        { label: "NPWP", value: employee.npwpRaw || employee.npwpMasked || "-" },
        { label: "Bank Payroll", value: employee.bankName || "Bank Mandiri" },
        { label: "No. Rekening", value: employee.bankAccountRaw || employee.bankAccountMasked || "-" },
      ]);
    }
  }

  // ===========================================================================
  // 11–12. PRESENSI & CUTI
  // ===========================================================================
  if (options.attendance) {
    const periodText = `${options.attendanceFrom ? formatDate(options.attendanceFrom) : "Awal"} s.d. ${
      options.attendanceTo ? formatDate(options.attendanceTo) : "Akhir"
    }`;
    section("Rekapitulasi Presensi & Kehadiran", { subtitle: periodText, follow: 60 });

    const summary = attendanceData?.summary || {
      workingDaysCount: 0,
      presentCount: 0,
      lateCount: 0,
      wfhCount: 0,
      leaveCount: 0,
      absentCount: 0,
      attendanceRate: 100,
    };

    const GAP = 10;
    const kpiW = (CONTENT_W - GAP * 3) / 4;
    const kpis = [
      { label: "HARI EFEKTIF", value: `${summary.workingDaysCount} Hari`, accent: COLORS.navy },
      { label: "HADIR TEPAT WAKTU", value: `${summary.presentCount} Hari`, accent: COLORS.navy },
      { label: "TERLAMBAT / WFH", value: `${summary.lateCount} / ${summary.wfhCount}`, accent: COLORS.navy },
      { label: "TINGKAT KEHADIRAN", value: `${summary.attendanceRate}%`, accent: COLORS.emerald },
    ];
    ensureSpace(46);
    kpis.forEach((k, i) => {
      const x = MARGIN + i * (kpiW + GAP);
      doc.save().roundedRect(x, y, kpiW, 40, 4).lineWidth(0.7).strokeColor(COLORS.border).stroke().restore();
      doc.save().rect(x + 4, y, kpiW - 8, 2.5).fill(k.accent).restore();
      doc.fillColor(COLORS.slateLight).font("Helvetica-Bold").fontSize(6.5).text(k.label, x + 10, y + 9, {
        width: kpiW - 16,
        lineBreak: false,
      });
      doc.fillColor(k.accent).font("Helvetica-Bold").fontSize(13).text(k.value, x + 10, y + 20, {
        width: kpiW - 16,
        lineBreak: false,
      });
    });
    y += 40 + 12;

    const MAX_ATT = 31;
    const allRecords = attendanceData?.records || [];
    const records = allRecords.slice(0, MAX_ATT);
    drawTable(
      [
        { header: "Tanggal", width: 82, value: (r) => formatDate(r.date) },
        { header: "Jam Masuk", width: 58, value: (r) => fmtTime(r.checkInTime) },
        { header: "Jam Pulang", width: 60, value: (r) => fmtTime(r.checkOutTime) },
        {
          header: "Status",
          width: 62,
          bold: true,
          value: (r) => ATTENDANCE_STATUS[r.status?.toUpperCase()]?.label ?? dash(r.status),
          color: (r) => ATTENDANCE_STATUS[r.status?.toUpperCase()]?.color,
        },
        { header: "Catatan", width: 259, value: (r) => cleanAttendanceNote(r.notes) },
      ],
      records,
      "Tidak ada catatan presensi dalam rentang tanggal ini.",
    );
    if (allRecords.length > MAX_ATT) {
      y -= 4;
      caption(`Menampilkan ${MAX_ATT} dari ${allRecords.length} catatan presensi terbaru.`);
    }

    section("Kuota & Saldo Cuti Tahun Berjalan");
    drawTable(
      [
        { header: "Jenis Cuti", width: 220, value: (r) => r.leaveTypeName || "Cuti Tahunan" },
        { header: "Hak Kuota", width: 90, align: "center", value: (r) => `${r.quotaDays} Hari` },
        { header: "Terpakai", width: 90, align: "center", value: (r) => `${r.usedDays} Hari` },
        {
          header: "Sisa Hari Cuti",
          width: 95,
          align: "center",
          bold: true,
          value: (r) => `${r.remainingDays} Hari`,
          color: () => COLORS.emerald,
        },
      ],
      attendanceData?.leaveBalances || [],
      "Tidak ada data kuota cuti untuk tahun ini.",
    );
  }

  // ===========================================================================
  // 13. DOKUMEN DIGITAL
  // ===========================================================================
  if (options.documents) {
    section("Inventaris Dokumen Digital Kepegawaian");
    drawTable(
      [
        { header: "Kategori", width: 85, value: (r) => dash(r.category) },
        { header: "Judul Dokumen", width: 170, value: (r) => dash(r.title) },
        { header: "Nama Berkas Asli", width: 175, value: (r) => dash(r.fileName) },
        { header: "Tanggal Unggah", width: 93, align: "center", value: (r) => (r.createdAt ? formatDate(r.createdAt) : "-") },
      ],
      employee.documents || [],
      "Belum ada dokumen digital yang diunggah ke arsip.",
    );
  }

  // ===========================================================================
  // 14. ASET KANTOR
  // ===========================================================================
  if (options.assets) {
    section("Inventaris Aset Kantor yang Dibawa Pegawai");
    drawTable(
      [
        { header: "Tag Aset", width: 85, value: (r) => dash(r.assetTag) },
        { header: "Nama Perangkat", width: 125, value: (r) => dash(r.name) },
        { header: "Brand / Model", width: 135, value: (r) => `${r.brand || ""} ${r.model || ""}`.trim() || "-" },
        { header: "Tgl Penyerahan", width: 80, align: "center", value: (r) => (r.assignedAt ? formatDate(r.assignedAt) : "-") },
        { header: "Kondisi", width: 98, value: (r) => r.conditionOut || "Baik" },
      ],
      activeAssets,
      "Tidak ada aset kantor yang tercatat dibawa oleh pegawai.",
    );
  }

  // ===========================================================================
  // LEMBAR PENGESAHAN (selalu di akhir, tidak terpotong antar halaman)
  // ===========================================================================
  {
    const BOX_H = 128;
    if (y > TOP) y += 12;
    ensureSpace(BOX_H);

    doc.save().roundedRect(MARGIN, y, CONTENT_W, BOX_H, 5).lineWidth(0.8).strokeColor(COLORS.border).stroke().restore();
    tintRect(MARGIN + 1, y + 1, CONTENT_W - 2, 22, COLORS.tint, 0.9);
    doc
      .fillColor(COLORS.navy)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("LEMBAR PENGESAHAN DOKUMEN KEPEGAWAIAN RESMI", MARGIN, y + 8, {
        width: CONTENT_W,
        align: "center",
        lineBreak: false,
      });

    const dateStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const colW = CONTENT_W / 2;

    const signCol = (
      x: number,
      lead: string,
      role: string,
      name: string,
      sub: string,
    ) => {
      const top = y + 32;
      doc.fillColor(COLORS.slateMedium).font("Helvetica").fontSize(7.5);
      doc.text(`${CITY}, ${dateStr}`, x, top, { width: colW - 40, lineBreak: false });
      doc.text(lead, x, top + 10, { width: colW - 40, lineBreak: false });
      doc.fillColor(COLORS.navy).font("Helvetica-Bold").text(role, x, top + 20, { width: colW - 40, lineBreak: false });
      hLine(top + 68, COLORS.slateMedium, 0.8, x, x + colW - 50);
      doc.fillColor(COLORS.slateDark).font("Helvetica-Bold").fontSize(8).text(name, x, top + 73, {
        width: colW - 50,
        lineBreak: false,
      });
      doc.fillColor(COLORS.slateMedium).font("Helvetica").fontSize(7).text(sub, x, top + 84, {
        width: colW - 50,
        lineBreak: false,
      });
    };

    signCol(
      MARGIN + 18,
      "Disiapkan & Dicetak Oleh,",
      "HR Administrator Lembaga",
      actor.name || "Administrator HR",
      actor.email,
    );
    signCol(
      MARGIN + colW + 14,
      "Mengetahui & Mengesahkan,",
      employee.manager?.fullName ? "Atasan Langsung Pegawai" : "Pimpinan Lembaga PSPK",
      employee.manager?.fullName || "Direktur Eksekutif PSPK",
      employee.manager?.currentPosition?.title || "Pusat Studi Pendidikan dan Kebijakan",
    );
    y += BOX_H + 6;
  }

  // ===========================================================================
  // FOOTER DI SEMUA HALAMAN
  // Margin bawah di-nol-kan sementara agar teks footer TIDAK memicu halaman kosong baru.
  // ===========================================================================
  const range = doc.bufferedPageRange();
  const shortDocId = Math.random().toString(36).substring(2, 10).toUpperCase();
  const printTimestamp = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const prevBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    hLine(803, COLORS.border, 0.5);
    doc.fillColor(COLORS.slateLight).font("Helvetica").fontSize(6.5);
    doc.text("DOKUMEN RAHASIA & TERBATAS – INTERNAL PSPK", MARGIN, 810, { width: 320, lineBreak: false });
    doc.text(`Halaman ${i + 1} dari ${range.count}`, MARGIN, 810, {
      width: CONTENT_W,
      align: "right",
      lineBreak: false,
    });
    doc.text(
      `ID: DOC-${shortDocId} • Dicetak oleh ${actor.name} • ${printTimestamp} WIB`,
      MARGIN,
      820,
      { width: CONTENT_W, lineBreak: false },
    );

    doc.page.margins.bottom = prevBottom;
  }

  doc.end();
  return finished;
}