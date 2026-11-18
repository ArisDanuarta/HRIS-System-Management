import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { formatDate, formatRupiah } from "@pspk/shared";
import { getStorageProvider } from "@pspk/storage";
import { getPtkpExplanation, getTaxMethodExplanation } from "@/lib/tax-explanation";

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

// Helper untuk mengonversi Readable stream ke Buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

// Helper untuk menemukan lokasi berkas gambar statis
function resolveImagePath(filename: string): string | null {
  const candidates = [
    path.join(process.cwd(), "apps/hris/public/images", filename),
    path.join(process.cwd(), "public/images", filename),
    path.join(__dirname, "../../../../../apps/hris/public/images", filename),
    path.join(__dirname, "../../../../public/images", filename),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

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
  bgHeader: "#102E50",
  white: "#FFFFFF",
  emerald: "#047857",
  amberBg: "#FEF3C7",
  amberText: "#92400E",
};

/**
 * Menghasilkan Dokumen PDF Rekam Kepegawaian 360° Resmi PSPK
 */
export async function generateEmployeeProfilePdf(
  data: EmployeePdfExportOptions,
): Promise<Buffer> {
  const { employee, actor, options, attendanceData, activeAssets = [] } = data;

  const doc = new PDFDocument({
    size: "A4",
    margin: 36,
    bufferPages: true,
  });

  const buffers: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => buffers.push(chunk));

  // Ambil buffer logo & watermark
  const logoPath = resolveImagePath("logo_pspk_horizontal.png");
  const iconPath = resolveImagePath("icon_pspk.jpg");

  // Ambil foto karyawan atau fallback avatar gender
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
    const isFemale =
      employee.gender?.toUpperCase() === "FEMALE" ||
      employee.gender?.toLowerCase() === "perempuan" ||
      employee.gender?.toLowerCase() === "wanita";
    const avatarPath = resolveImagePath(isFemale ? "Avatar_Wanita.jpg" : "Avatar_Pria.jpg");
    if (avatarPath && fs.existsSync(avatarPath)) {
      photoBuffer = fs.readFileSync(avatarPath);
    }
  }

  // Helper menggambar Watermark & Header tetap di halaman
  const drawPageHeaderAndWatermark = () => {
    // 1. Watermark Transparan 6% di Tengah
    if (iconPath && fs.existsSync(iconPath)) {
      doc.save();
      doc.opacity(0.06);
      doc.image(iconPath, 172, 280, { width: 250 });
      doc.restore();
    }

    // Jika pegawai berstatus keluar, watermark teks diagonal merah transparan
    if (employee.status === "TERMINATED" || employee.status === "RESIGNED") {
      doc.save();
      doc.opacity(0.12);
      doc.rotate(-30, { origin: [297, 420] });
      doc.fillColor(COLORS.maroon).fontSize(38).font("Helvetica-Bold");
      doc.text("STATUS: NONAKTIF / TERMINATED", 60, 410, { align: "center", width: 480 });
      doc.restore();
    }

    // 2. Header Kop Resmi
    if (logoPath && fs.existsSync(logoPath)) {
      doc.image(logoPath, 36, 24, { width: 130 });
    } else {
      doc.fillColor(COLORS.navy).fontSize(14).font("Helvetica-Bold").text("PSPK", 36, 26);
    }

    doc
      .fillColor(COLORS.navy)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("DOKUMEN REKAM KEPEGAWAIAN 360°", 180, 24, { align: "right", width: 379 });

    doc
      .fillColor(COLORS.slateMedium)
      .fontSize(7.5)
      .font("Helvetica")
      .text("Pusat Studi Pendidikan dan Kebijakan (PSPK)", 180, 37, { align: "right", width: 379 });

    // Garis Aksen Kop: Navy tebal + Gold tipis
    doc.strokeColor(COLORS.navy).lineWidth(1.5).moveTo(36, 52).lineTo(559, 52).stroke();
    doc.strokeColor(COLORS.gold).lineWidth(1).moveTo(36, 55).lineTo(559, 55).stroke();
  };

  // Helper menggambar Header Seksi / Subjudul
  const drawSectionHeader = (title: string, yPos: number): number => {
    doc.rect(36, yPos, 523, 18).fill(COLORS.navy);
    doc
      .fillColor(COLORS.white)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(title.toUpperCase(), 44, yPos + 4.5);
    return yPos + 24;
  };

  // Helper menggambar Tabel Key-Value 2 Kolom
  const drawKeyValueGrid = (
    items: Array<{ label: string; value: string }>,
    startY: number,
  ): number => {
    let curY = startY;
    const rowHeight = 18;

    for (let i = 0; i < items.length; i += 2) {
      const left = items[i];
      const right = items[i + 1];
      const isZebra = Math.floor(i / 2) % 2 === 1;

      if (isZebra) {
        doc.rect(36, curY, 523, rowHeight).fill(COLORS.bgZebra);
      }

      // Border bawah baris
      doc.strokeColor(COLORS.borderLight).lineWidth(0.5).moveTo(36, curY + rowHeight).lineTo(559, curY + rowHeight).stroke();

      if (left) {
        doc.fillColor(COLORS.slateLight).fontSize(7.5).font("Helvetica-Bold").text(left.label, 42, curY + 4.5, { width: 95 });
        doc.fillColor(COLORS.slateDark).fontSize(8).font("Helvetica").text(`: ${left.value}`, 140, curY + 4.5, { width: 145 });
      }

      if (right) {
        doc.fillColor(COLORS.slateLight).fontSize(7.5).font("Helvetica-Bold").text(right.label, 305, curY + 4.5, { width: 95 });
        doc.fillColor(COLORS.slateDark).fontSize(8).font("Helvetica").text(`: ${right.value}`, 405, curY + 4.5, { width: 145 });
      }

      curY += rowHeight;
    }

    return curY + 8;
  };

  // Helper menghitung Masa Kerja
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

  // =========================================================================
  // HALAMAN 1: SAMPUL PROFIL & RINGKASAN EKSEKUTIF
  // =========================================================================
  drawPageHeaderAndWatermark();

  let y = 68;

  // Kotak Identitas Utama + Pasfoto
  doc.roundedRect(36, y, 523, 115, 6).strokeColor(COLORS.border).lineWidth(1).stroke();

  // Pasfoto Profil di Sebelah Kiri
  if (photoBuffer) {
    try {
      doc.image(photoBuffer, 46, y + 10, { width: 75, height: 95 });
      doc.roundedRect(46, y + 10, 75, 95, 3).strokeColor(COLORS.navyLight).lineWidth(1).stroke();
    } catch {
      doc.rect(46, y + 10, 75, 95).fill(COLORS.bgZebra);
      doc.fillColor(COLORS.slateMedium).fontSize(8).font("Helvetica").text("Foto Pegawai", 50, y + 50, { width: 67, align: "center" });
    }
  } else {
    doc.rect(46, y + 10, 75, 95).fill(COLORS.bgZebra);
    doc.fillColor(COLORS.slateMedium).fontSize(8).font("Helvetica").text("Foto Pegawai", 50, y + 50, { width: 67, align: "center" });
  }

  // Nama & Detail Inti di Sebelah Kanan Foto
  const textX = 132;
  doc
    .fillColor(COLORS.navy)
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(employee.fullName || "-", textX, y + 12, { width: 415 });

  if (employee.nickname) {
    doc.fillColor(COLORS.slateMedium).fontSize(8).font("Helvetica-Oblique").text(`(Panggilan: "${employee.nickname}")`, textX, y + 29);
  }

  doc.strokeColor(COLORS.borderLight).lineWidth(0.5).moveTo(textX, y + 42).lineTo(545, y + 42).stroke();

  // Grid Ringkas di samping foto
  const summarySideItems = [
    { label: "Nomor Induk Pegawai", value: employee.employeeNo || "-" },
    { label: "Jabatan Utama", value: employee.currentPosition?.title || "Belum ada jabatan" },
    { label: "Divisi / Unit Kerja", value: employee.currentDepartment?.name || "Belum ada divisi" },
    { label: "Status Kepegawaian", value: employee.status || "-" },
    { label: "Tanggal Bergabung", value: formatDate(employee.joinDate) },
    { label: "Masa Kerja", value: formatTenureText(employee.joinDate) },
  ];

  const sideY = y + 47;
  summarySideItems.forEach((item, idx) => {
    const isCol2 = idx % 2 === 1;
    const colX = isCol2 ? textX + 210 : textX;
    const curSideY = sideY + Math.floor(idx / 2) * 19;

    doc.fillColor(COLORS.slateLight).fontSize(7).font("Helvetica-Bold").text(item.label, colX, curSideY);
    doc.fillColor(COLORS.slateDark).fontSize(8).font("Helvetica").text(item.value, colX, curSideY + 9, { width: 200 });
  });

  y += 126;

  // Bagian 1: Data Pribadi & Kontak
  if (options.personal) {
    y = drawSectionHeader("1. Data Diri & Informasi Kontak Pegawai", y);

    const personalItems = [
      { label: "Jenis Kelamin", value: employee.gender === "FEMALE" ? "Perempuan" : employee.gender === "MALE" ? "Laki-laki" : "-" },
      { label: "Status Pernikahan", value: employee.maritalStatus || "-" },
      { label: "Tempat, Tgl Lahir", value: `${employee.birthPlace || "-"}, ${employee.birthDate ? formatDate(employee.birthDate) : "-"}` },
      { label: "Agama", value: employee.religion || "-" },
      { label: "Golongan Darah", value: employee.bloodType || "-" },
      { label: "Kewarganegaraan", value: employee.citizenship || "WNI" },
      { label: "Email Kantor", value: employee.workEmail || "-" },
      { label: "Email Pribadi", value: employee.personalEmail || "-" },
      { label: "No. HP / WhatsApp", value: employee.phone || "-" },
      { label: "Telepon Rumah", value: employee.landlinePhone || "-" },
      { label: "Kontak Darurat", value: employee.emergencyContactName ? `${employee.emergencyContactName} (${employee.emergencyContactRelation || "Kerabat"})` : "-" },
      { label: "No. HP Darurat", value: employee.emergencyContactPhone || "-" },
    ];

    y = drawKeyValueGrid(personalItems, y);
  }

  // =========================================================================
  // HALAMAN 2: ALAMAT & SUSUNAN KELUARGA
  // =========================================================================
  if (options.address || options.family) {
    doc.addPage();
    drawPageHeaderAndWatermark();
    y = 68;

    // Alamat KTP & Domisili
    if (options.address) {
      y = drawSectionHeader("2. Rincian Alamat Lengkap (KTP & Domisili)", y);

      const ktpAddr = employee.addresses?.find((a) => a.type === "KTP");
      const domAddr = employee.addresses?.find((a) => a.type === "DOMICILE");

      const formatFullAddress = (addr?: PdfAddressItem) => {
        if (!addr) return employee.address || "Belum dicantumkan";
        return `${addr.street || ""}, Kel. ${addr.kelurahan || "-"}, Kec. ${addr.kecamatan || "-"}, ${addr.city || "-"}, ${addr.province || "-"} ${addr.postalCode ? `(${addr.postalCode})` : ""}`.trim();
      };

      const addressItems = [
        { label: "Alamat Sesuai KTP", value: formatFullAddress(ktpAddr) },
        { label: "Alamat Domisili", value: formatFullAddress(domAddr) },
      ];

      addressItems.forEach((addr) => {
        doc.rect(36, y, 523, 26).fill(COLORS.bgZebra);
        doc.strokeColor(COLORS.borderLight).lineWidth(0.5).rect(36, y, 523, 26).stroke();
        doc.fillColor(COLORS.slateLight).fontSize(7.5).font("Helvetica-Bold").text(addr.label, 44, y + 4);
        doc.fillColor(COLORS.slateDark).fontSize(8).font("Helvetica").text(addr.value, 44, y + 14, { width: 505 });
        y += 31;
      });

      y += 6;
    }

    // Susunan Anggota Keluarga
    if (options.family) {
      y = drawSectionHeader("3. Susunan Anggota Keluarga & Tanggungan", y);

      const families = employee.familyMembers || [];

      // Tabel Header
      doc.rect(36, y, 523, 18).fill(COLORS.navyLight);
      doc.fillColor(COLORS.white).fontSize(7.5).font("Helvetica-Bold");
      doc.text("No", 42, y + 5, { width: 20 });
      doc.text("Nama Anggota Keluarga", 68, y + 5, { width: 140 });
      doc.text("Hubungan", 215, y + 5, { width: 85 });
      doc.text("Tgl Lahir / Usia", 305, y + 5, { width: 95 });
      doc.text("No. Telepon", 405, y + 5, { width: 75 });
      doc.text("Tanggungan", 485, y + 5, { width: 65, align: "center" });
      y += 18;

      if (families.length === 0) {
        doc.rect(36, y, 523, 20).fill(COLORS.bgZebra);
        doc.fillColor(COLORS.slateMedium).fontSize(8).font("Helvetica-Oblique").text("Tidak ada data keluarga yang dicatatkan.", 44, y + 6);
        y += 24;
      } else {
        families.forEach((fam, idx: number) => {
          const isZebra = idx % 2 === 1;
          if (isZebra) doc.rect(36, y, 523, 17).fill(COLORS.bgZebra);
          doc.strokeColor(COLORS.borderLight).lineWidth(0.5).moveTo(36, y + 17).lineTo(559, y + 17).stroke();

          doc.fillColor(COLORS.slateDark).fontSize(7.5).font("Helvetica");
          doc.text(String(idx + 1), 42, y + 4.5);
          doc.text(fam.name || "-", 68, y + 4.5, { width: 140 });
          doc.text(fam.relation || "-", 215, y + 4.5, { width: 85 });
          doc.text(fam.birthDate ? formatDate(fam.birthDate) : "-", 305, y + 4.5, { width: 95 });
          doc.text(fam.phone || "-", 405, y + 4.5, { width: 75 });
          doc.text(fam.isDependent ? "Ya" : "Tidak", 485, y + 4.5, { width: 65, align: "center" });

          y += 17;
        });
        y += 8;
      }
    }
  }

  // =========================================================================
  // HALAMAN 3: PENDIDIKAN, PELATIHAN & PENGALAMAN KERJA
  // =========================================================================
  if (options.education) {
    doc.addPage();
    drawPageHeaderAndWatermark();
    y = 68;

    // Pendidikan Formal
    y = drawSectionHeader("4. Riwayat Pendidikan Formal", y);
    const edus = employee.educations || [];

    doc.rect(36, y, 523, 18).fill(COLORS.navyLight);
    doc.fillColor(COLORS.white).fontSize(7.5).font("Helvetica-Bold");
    doc.text("Jenjang", 44, y + 5, { width: 55 });
    doc.text("Institusi / Universitas", 105, y + 5, { width: 175 });
    doc.text("Program Studi / Jurusan", 285, y + 5, { width: 145 });
    doc.text("Tahun Lulus", 435, y + 5, { width: 60, align: "center" });
    doc.text("IPK / Nilai", 500, y + 5, { width: 50, align: "center" });
    y += 18;

    if (edus.length === 0) {
      doc.rect(36, y, 523, 18).fill(COLORS.bgZebra);
      doc.fillColor(COLORS.slateMedium).fontSize(8).font("Helvetica-Oblique").text("Belum ada riwayat pendidikan yang dicatatkan.", 44, y + 5);
      y += 24;
    } else {
      edus.forEach((edu, idx: number) => {
        if (idx % 2 === 1) doc.rect(36, y, 523, 17).fill(COLORS.bgZebra);
        doc.strokeColor(COLORS.borderLight).lineWidth(0.5).moveTo(36, y + 17).lineTo(559, y + 17).stroke();

        doc.fillColor(COLORS.slateDark).fontSize(7.5).font("Helvetica");
        doc.text(edu.level || "-", 44, y + 4.5, { width: 55 });
        doc.text(edu.institution || "-", 105, y + 4.5, { width: 175 });
        doc.text(edu.major || "-", 285, y + 4.5, { width: 145 });
        doc.text(String(edu.graduationYear || "-"), 435, y + 4.5, { width: 60, align: "center" });
        doc.text(edu.gpa ? Number(String(edu.gpa)).toFixed(2) : "-", 500, y + 4.5, { width: 50, align: "center" });
        y += 17;
      });
      y += 10;
    }

    // Pelatihan & Sertifikasi
    y = drawSectionHeader("5. Riwayat Pelatihan, Riset & Sertifikasi", y);
    const trainings = employee.trainings || [];

    doc.rect(36, y, 523, 18).fill(COLORS.navyLight);
    doc.fillColor(COLORS.white).fontSize(7.5).font("Helvetica-Bold");
    doc.text("Nama Pelatihan / Sertifikasi", 44, y + 5, { width: 180 });
    doc.text("Lembaga Penyelenggara", 230, y + 5, { width: 150 });
    doc.text("Periode / Tahun", 385, y + 5, { width: 90 });
    doc.text("Durasi Jam", 480, y + 5, { width: 70, align: "center" });
    y += 18;

    if (trainings.length === 0) {
      doc.rect(36, y, 523, 18).fill(COLORS.bgZebra);
      doc.fillColor(COLORS.slateMedium).fontSize(8).font("Helvetica-Oblique").text("Belum ada riwayat pelatihan yang dicatatkan.", 44, y + 5);
      y += 24;
    } else {
      trainings.forEach((tr, idx: number) => {
        if (idx % 2 === 1) doc.rect(36, y, 523, 17).fill(COLORS.bgZebra);
        doc.strokeColor(COLORS.borderLight).lineWidth(0.5).moveTo(36, y + 17).lineTo(559, y + 17).stroke();

        doc.fillColor(COLORS.slateDark).fontSize(7.5).font("Helvetica");
        doc.text(tr.name || "-", 44, y + 4.5, { width: 180 });
        doc.text(tr.organizer || "-", 230, y + 4.5, { width: 150 });
        doc.text(tr.startDate ? formatDate(tr.startDate) : "-", 385, y + 4.5, { width: 90 });
        doc.text(tr.duration || "-", 480, y + 4.5, { width: 70, align: "center" });
        y += 17;
      });
      y += 10;
    }

    // Pengalaman Kerja Terdahulu
    y = drawSectionHeader("6. Riwayat Pengalaman Kerja Terdahulu", y);
    const works = employee.workExperiences || [];

    doc.rect(36, y, 523, 18).fill(COLORS.navyLight);
    doc.fillColor(COLORS.white).fontSize(7.5).font("Helvetica-Bold");
    doc.text("Perusahaan / Lembaga", 44, y + 5, { width: 150 });
    doc.text("Posisi / Jabatan", 200, y + 5, { width: 140 });
    doc.text("Periode Bekerja", 345, y + 5, { width: 110 });
    doc.text("Alasan Berhenti", 460, y + 5, { width: 95 });
    y += 18;

    if (works.length === 0) {
      doc.rect(36, y, 523, 18).fill(COLORS.bgZebra);
      doc.fillColor(COLORS.slateMedium).fontSize(8).font("Helvetica-Oblique").text("Belum ada riwayat pengalaman kerja yang dicatatkan.", 44, y + 5);
      y += 24;
    } else {
      works.forEach((w, idx: number) => {
        if (idx % 2 === 1) doc.rect(36, y, 523, 17).fill(COLORS.bgZebra);
        doc.strokeColor(COLORS.borderLight).lineWidth(0.5).moveTo(36, y + 17).lineTo(559, y + 17).stroke();

        doc.fillColor(COLORS.slateDark).fontSize(7.5).font("Helvetica");
        doc.text(w.companyName || "-", 44, y + 4.5, { width: 150 });
        doc.text(w.jobTitle || "-", 200, y + 4.5, { width: 140 });
        doc.text(`${w.startDate ? formatDate(w.startDate) : "-"} s.d. ${w.endDate ? formatDate(w.endDate) : "Sekarang"}`, 345, y + 4.5, { width: 110 });
        doc.text(w.reasonForLeaving || "-", 460, y + 4.5, { width: 95 });
        y += 17;
      });
      y += 10;
    }
  }

  // =========================================================================
  // HALAMAN 4: PENEMPATAN, KONTRAK & KOMPENSASI
  // =========================================================================
  if (options.employment || options.contracts || options.compensation || options.sensitive) {
    doc.addPage();
    drawPageHeaderAndWatermark();
    y = 68;

    // Penempatan & Riwayat Jabatan
    if (options.employment) {
      y = drawSectionHeader("7. Penempatan, Divisi & Riwayat Jabatan", y);

      const placementItems = [
        { label: "Divisi Saat Ini", value: employee.currentDepartment?.name || "-" },
        { label: "Jabatan Saat Ini", value: employee.currentPosition?.title || "-" },
        { label: "Atasan Langsung", value: employee.manager?.fullName ? `${employee.manager.fullName} (${employee.manager.employeeNo})` : "Direksi / Mandiri" },
        { label: "Lokasi Kantor", value: employee.workLocation?.name || "Kantor PSPK Jakarta" },
        { label: "Entitas Hukum", value: employee.legalEntity?.name || "Yayasan PSPK" },
        { label: "Akhir Probation", value: employee.probationEndDate ? formatDate(employee.probationEndDate) : "-" },
      ];

      y = drawKeyValueGrid(placementItems, y);
    }

    // Riwayat Kontrak Kerja
    if (options.contracts) {
      y = drawSectionHeader("8. Riwayat Kontrak Kerja Pegawai (PKWT/SK)", y);
      const contracts = employee.contracts || [];

      doc.rect(36, y, 523, 18).fill(COLORS.navyLight);
      doc.fillColor(COLORS.white).fontSize(7.5).font("Helvetica-Bold");
      doc.text("Jenis Ikatan", 44, y + 5, { width: 120 });
      doc.text("Mulai Kontrak", 170, y + 5, { width: 85 });
      doc.text("Akhir Kontrak", 260, y + 5, { width: 85 });
      doc.text("Status Kontrak", 350, y + 5, { width: 75, align: "center" });
      doc.text("Keterangan", 430, y + 5, { width: 125 });
      y += 18;

      if (contracts.length === 0) {
        doc.rect(36, y, 523, 18).fill(COLORS.bgZebra);
        doc.fillColor(COLORS.slateMedium).fontSize(8).font("Helvetica-Oblique").text("Tidak ada riwayat kontrak.", 44, y + 5);
        y += 24;
      } else {
        contracts.forEach((c, idx: number) => {
          if (idx % 2 === 1) doc.rect(36, y, 523, 17).fill(COLORS.bgZebra);
          doc.strokeColor(COLORS.borderLight).lineWidth(0.5).moveTo(36, y + 17).lineTo(559, y + 17).stroke();

          doc.fillColor(COLORS.slateDark).fontSize(7.5).font("Helvetica");
          doc.text(c.employmentTypeMaster?.name || c.type || "-", 44, y + 4.5, { width: 120 });
          doc.text(c.startDate ? formatDate(c.startDate) : "-", 170, y + 4.5, { width: 85 });
          doc.text(c.endDate ? formatDate(c.endDate) : "Tetap / -", 260, y + 4.5, { width: 85 });
          doc.text(c.status || "-", 350, y + 4.5, { width: 75, align: "center" });
          doc.text(c.notes || "-", 430, y + 4.5, { width: 125 });
          y += 17;
        });
        y += 10;
      }
    }

    // Kompensasi & Pajak (Jika Diizinkan)
    y = drawSectionHeader("9. Struktur Kompensasi & Pajak Penghasilan (PPh 21)", y);
    if (!options.compensation) {
      doc.rect(36, y, 523, 20).fill(COLORS.bgZebra);
      doc.fillColor(COLORS.slateLight).fontSize(7.5).font("Helvetica-Oblique").text("— INFORMASI STRUKTUR KOMPENSASI DIKUNCI / TIDAK DISERTAKAN DALAM DOKUMEN INI —", 44, y + 6);
      y += 28;
    } else {
      const activeContract = employee.contracts?.find((c) => c.status === "ACTIVE") || employee.contracts?.[0];
      const baseSalary = activeContract?.wageType === "HOURLY" ? 0 : activeContract?.baseSalary ? Number(activeContract.baseSalary) : 0;
      const hourlyRate = activeContract?.hourlyRate ? Number(activeContract.hourlyRate) : 0;
      const allowances = employee.salaryComponents || [];
      const totalAllowances = allowances.reduce((acc: number, c) => acc + c.amount, 0);

      const ptkpInfo = getPtkpExplanation(employee.ptkpStatus);
      const taxMethodInfo = getTaxMethodExplanation(employee.taxMethod);

      const compItems = [
        { label: "Gaji Pokok", value: activeContract?.wageType === "HOURLY" ? `${formatRupiah(hourlyRate)} / jam` : formatRupiah(baseSalary) },
        { label: "Total Tunjangan", value: formatRupiah(totalAllowances) },
        { label: "Estimasi Bruto", value: formatRupiah(baseSalary + totalAllowances) },
        { label: "Status PTKP & TER", value: `${employee.ptkpStatus || "TK/0"} (${ptkpInfo?.terCategory || "TER A"})` },
        { label: "Metode Pajak", value: `${employee.taxMethod || "GROSS"} (${taxMethodInfo?.badge || "-"})` },
        { label: "Iuran BPJS Kes (1%)", value: formatRupiah(Math.round(baseSalary * 0.01)) },
      ];

      y = drawKeyValueGrid(compItems, y);
    }

    // Data Sensitif (Jika Diizinkan)
    y = drawSectionHeader("10. Identitas Sensitif & Payroll Lembaga", y);
    if (!options.sensitive) {
      doc.rect(36, y, 523, 20).fill(COLORS.bgZebra);
      doc.fillColor(COLORS.slateLight).fontSize(7.5).font("Helvetica-Oblique").text("— DATA SENSITIF TERENKRIPSI (NIK, NPWP, BANK) DILINDUNGI & TIDAK DIBUKA —", 44, y + 6);
      y += 28;
    } else {
      const sensitiveItems = [
        { label: "Nomor Induk Kependudukan (NIK)", value: employee.nikRaw || employee.nikMasked || "-" },
        { label: "Nomor Pokok Wajib Pajak (NPWP)", value: employee.npwpRaw || employee.npwpMasked || "-" },
        { label: "Bank Payroll Lembaga", value: employee.bankName || "Bank Mandiri" },
        { label: "Nomor Rekening Bank", value: employee.bankAccountRaw || employee.bankAccountMasked || "-" },
      ];

      y = drawKeyValueGrid(sensitiveItems, y);
    }
  }

  // =========================================================================
  // HALAMAN 5: REKAPITULASI ABSENSI & CUTI
  // =========================================================================
  if (options.attendance) {
    doc.addPage();
    drawPageHeaderAndWatermark();
    y = 68;

    y = drawSectionHeader(`11. Rekapitulasi Presensi & Kehadiran Pegawai (${options.attendanceFrom || "Awal"} s.d. ${options.attendanceTo || "Akhir"})`, y);

    const summary = attendanceData?.summary || {
      workingDaysCount: 0,
      presentCount: 0,
      lateCount: 0,
      wfhCount: 0,
      leaveCount: 0,
      absentCount: 0,
      attendanceRate: 100,
    };

    // 4 Kotak KPI Kehadiran
    const kpiWidth = 125;
    const kpiY = y;
    const kpis = [
      { label: "HARI EFEKTIF", value: `${summary.workingDaysCount} Hari` },
      { label: "HADIR TEPAT WAKTU", value: `${summary.presentCount} Hari` },
      { label: "TERLAMBAT / WFH", value: `${summary.lateCount} / ${summary.wfhCount}` },
      { label: "TINGKAT KEHADIRAN", value: `${summary.attendanceRate}%` },
    ];

    kpis.forEach((kpi, idx) => {
      const kX = 36 + idx * 133;
      doc.rect(kX, kpiY, kpiWidth, 34).fill(COLORS.bgZebra);
      doc.strokeColor(COLORS.borderLight).lineWidth(0.5).rect(kX, kpiY, kpiWidth, 34).stroke();
      doc.fillColor(COLORS.slateLight).fontSize(7).font("Helvetica-Bold").text(kpi.label, kX + 8, kpiY + 6);
      doc.fillColor(COLORS.navy).fontSize(12).font("Helvetica-Bold").text(kpi.value, kX + 8, kpiY + 16);
    });

    y += 44;

    // Tabel Log Kehadiran Harian (Maksimal 15 baris terakhir dalam rentang)
    const records = attendanceData?.records || [];
    doc.rect(36, y, 523, 16).fill(COLORS.navyLight);
    doc.fillColor(COLORS.white).fontSize(7.5).font("Helvetica-Bold");
    doc.text("Tanggal", 44, y + 4.5, { width: 85 });
    doc.text("Jam Masuk", 135, y + 4.5, { width: 75 });
    doc.text("Jam Pulang", 215, y + 4.5, { width: 75 });
    doc.text("Status Kehadiran", 295, y + 4.5, { width: 95 });
    doc.text("Catatan Kehadiran", 395, y + 4.5, { width: 160 });
    y += 16;

    if (records.length === 0) {
      doc.rect(36, y, 523, 18).fill(COLORS.bgZebra);
      doc.fillColor(COLORS.slateMedium).fontSize(8).font("Helvetica-Oblique").text("Tidak ada catatan presensi dalam rentang tanggal ini.", 44, y + 5);
      y += 24;
    } else {
      records.slice(0, 16).forEach((rec, idx: number) => {
        if (idx % 2 === 1) doc.rect(36, y, 523, 15).fill(COLORS.bgZebra);
        doc.strokeColor(COLORS.borderLight).lineWidth(0.5).moveTo(36, y + 15).lineTo(559, y + 15).stroke();

        doc.fillColor(COLORS.slateDark).fontSize(7.5).font("Helvetica");
        doc.text(formatDate(rec.date), 44, y + 3.5, { width: 85 });
        doc.text(rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-", 135, y + 3.5, { width: 75 });
        doc.text(rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-", 215, y + 3.5, { width: 75 });
        doc.text(rec.status || "-", 295, y + 3.5, { width: 95 });
        doc.text(rec.notes || "-", 395, y + 3.5, { width: 160, ellipsis: true });
        y += 15;
      });
      y += 10;
    }

    // Tabel Saldo Cuti Pegawai
    y = drawSectionHeader("12. Kuota Saldo Cuti Pegawai Tahun Berjalan", y);
    const leaveBalances = attendanceData?.leaveBalances || [];

    doc.rect(36, y, 523, 16).fill(COLORS.navyLight);
    doc.fillColor(COLORS.white).fontSize(7.5).font("Helvetica-Bold");
    doc.text("Jenis Cuti", 44, y + 4.5, { width: 220 });
    doc.text("Hak Kuota", 270, y + 4.5, { width: 90, align: "center" });
    doc.text("Terpakai", 365, y + 4.5, { width: 90, align: "center" });
    doc.text("Sisa Hari Cuti", 460, y + 4.5, { width: 95, align: "center" });
    y += 16;

    if (leaveBalances.length === 0) {
      doc.rect(36, y, 523, 18).fill(COLORS.bgZebra);
      doc.fillColor(COLORS.slateMedium).fontSize(8).font("Helvetica-Oblique").text("Tidak ada data kuota cuti untuk tahun ini.", 44, y + 5);
      y += 24;
    } else {
      leaveBalances.forEach((lb, idx: number) => {
        if (idx % 2 === 1) doc.rect(36, y, 523, 16).fill(COLORS.bgZebra);
        doc.strokeColor(COLORS.borderLight).lineWidth(0.5).moveTo(36, y + 16).lineTo(559, y + 16).stroke();

        doc.fillColor(COLORS.slateDark).fontSize(7.5).font("Helvetica");
        doc.text(lb.leaveTypeName || "Cuti Tahunan", 44, y + 4);
        doc.text(`${lb.quotaDays} Hari`, 270, y + 4, { width: 90, align: "center" });
        doc.text(`${lb.usedDays} Hari`, 365, y + 4, { width: 90, align: "center" });
        doc.fillColor(COLORS.emerald).font("Helvetica-Bold").text(`${lb.remainingDays} Hari`, 460, y + 4, { width: 95, align: "center" });
        y += 16;
      });
      y += 10;
    }
  }

  // =========================================================================
  // HALAMAN 6: DOKUMEN, ASET & PENGESAHAN DOKUMEN
  // =========================================================================
  if (options.documents || options.assets) {
    doc.addPage();
    drawPageHeaderAndWatermark();
    y = 68;

    // Dokumen Digital
    if (options.documents) {
      y = drawSectionHeader("13. Daftar Inventaris Dokumen Digital Kepegawaian", y);
      const docs = employee.documents || [];

      doc.rect(36, y, 523, 16).fill(COLORS.navyLight);
      doc.fillColor(COLORS.white).fontSize(7.5).font("Helvetica-Bold");
      doc.text("Kategori Dokumen", 44, y + 4.5, { width: 140 });
      doc.text("Judul Dokumen", 190, y + 4.5, { width: 175 });
      doc.text("Nama Berkas Asli", 370, y + 4.5, { width: 110 });
      doc.text("Tanggal Unggah", 485, y + 4.5, { width: 70, align: "center" });
      y += 16;

      if (docs.length === 0) {
        doc.rect(36, y, 523, 18).fill(COLORS.bgZebra);
        doc.fillColor(COLORS.slateMedium).fontSize(8).font("Helvetica-Oblique").text("Belum ada dokumen digital yang diunggah ke arsip.", 44, y + 5);
        y += 24;
      } else {
        docs.forEach((d, idx: number) => {
          if (idx % 2 === 1) doc.rect(36, y, 523, 16).fill(COLORS.bgZebra);
          doc.strokeColor(COLORS.borderLight).lineWidth(0.5).moveTo(36, y + 16).lineTo(559, y + 16).stroke();

          doc.fillColor(COLORS.slateDark).fontSize(7.5).font("Helvetica");
          doc.text(d.category || "-", 44, y + 4, { width: 140 });
          doc.text(d.title || "-", 190, y + 4, { width: 175, ellipsis: true });
          doc.text(d.fileName || "-", 370, y + 4, { width: 110, ellipsis: true });
          doc.text(d.createdAt ? formatDate(d.createdAt) : "-", 485, y + 4, { width: 70, align: "center" });
          y += 16;
        });
        y += 10;
      }
    }

    // Aset Inventaris Kantor
    if (options.assets) {
      y = drawSectionHeader("14. Daftar Inventaris Aset Kantor yang Dibawa Pegawai", y);

      doc.rect(36, y, 523, 16).fill(COLORS.navyLight);
      doc.fillColor(COLORS.white).fontSize(7.5).font("Helvetica-Bold");
      doc.text("Tag Aset", 44, y + 4.5, { width: 85 });
      doc.text("Nama Perangkat", 135, y + 4.5, { width: 165 });
      doc.text("Brand / Model", 305, y + 4.5, { width: 120 });
      doc.text("Tgl Penyerahan", 430, y + 4.5, { width: 70 });
      doc.text("Kondisi", 505, y + 4.5, { width: 50, align: "center" });
      y += 16;

      if (activeAssets.length === 0) {
        doc.rect(36, y, 523, 18).fill(COLORS.bgZebra);
        doc.fillColor(COLORS.slateMedium).fontSize(8).font("Helvetica-Oblique").text("Tidak ada aset kantor yang tercatat dibawa oleh pegawai.", 44, y + 5);
        y += 24;
      } else {
        activeAssets.forEach((ast, idx: number) => {
          if (idx % 2 === 1) doc.rect(36, y, 523, 16).fill(COLORS.bgZebra);
          doc.strokeColor(COLORS.borderLight).lineWidth(0.5).moveTo(36, y + 16).lineTo(559, y + 16).stroke();

          doc.fillColor(COLORS.slateDark).fontSize(7.5).font("Helvetica");
          doc.text(ast.assetTag || "-", 44, y + 4, { width: 85 });
          doc.text(ast.name || "-", 135, y + 4, { width: 165 });
          doc.text(`${ast.brand || ""} ${ast.model || ""}`.trim() || "-", 305, y + 4, { width: 120 });
          doc.text(ast.assignedAt ? formatDate(ast.assignedAt) : "-", 430, y + 4, { width: 70 });
          doc.text(ast.conditionOut || "Baik", 505, y + 4, { width: 50, align: "center" });
          y += 16;
        });
        y += 10;
      }
    }

    // =========================================================================
    // KOLOM PENGESAHAN RESMI (2 Kolom Tanda Tangan)
    // =========================================================================
    y = Math.max(y + 10, 640);

    doc.rect(36, y, 523, 140).fill(COLORS.bgZebra);
    doc.strokeColor(COLORS.border).lineWidth(1).rect(36, y, 523, 140).stroke();

    doc.fillColor(COLORS.navy).fontSize(8.5).font("Helvetica-Bold").text("LEMBAR PENGESAHAN DOKUMEN KEPEGAWAIAN RESMI", 44, y + 8, { align: "center", width: 507 });

    const currentDateStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const sigY = y + 26;

    // Kolom Kiri: Disiapkan Oleh (HR Administrator)
    doc.fillColor(COLORS.slateMedium).fontSize(7.5).font("Helvetica").text(`Jakarta, ${currentDateStr}`, 50, sigY);
    doc.text("Disiapkan & Dicetak Oleh,", 50, sigY + 10);
    doc.fillColor(COLORS.navy).font("Helvetica-Bold").text("HR Administrator Lembaga", 50, sigY + 20);

    // Garis tanda tangan kiri
    doc.strokeColor(COLORS.slateMedium).lineWidth(0.8).moveTo(50, sigY + 75).lineTo(50 + 190, sigY + 75).stroke();
    doc.fillColor(COLORS.slateDark).fontSize(8).font("Helvetica-Bold").text(actor.name || "Administrator HR", 50, sigY + 80);
    doc.fillColor(COLORS.slateMedium).fontSize(7).font("Helvetica").text(actor.email, 50, sigY + 91);

    // Kolom Kanan: Diketahui & Disetujui (Atasan Langsung / Direktur)
    const rightColX = 310;
    doc.fillColor(COLORS.slateMedium).fontSize(7.5).font("Helvetica").text(`Jakarta, ${currentDateStr}`, rightColX, sigY);
    doc.text("Mengetahui & Mengesahkan,", rightColX, sigY + 10);
    doc.fillColor(COLORS.navy).font("Helvetica-Bold").text(employee.manager?.fullName ? "Atasan Langsung Pegawai" : "Pimpinan Lembaga PSPK", rightColX, sigY + 20);

    // Garis tanda tangan kanan
    doc.strokeColor(COLORS.slateMedium).lineWidth(0.8).moveTo(rightColX, sigY + 75).lineTo(rightColX + 190, sigY + 75).stroke();
    doc.fillColor(COLORS.slateDark).fontSize(8).font("Helvetica-Bold").text(employee.manager?.fullName || "Direktur Eksekutif PSPK", rightColX, sigY + 80);
    doc.fillColor(COLORS.slateMedium).fontSize(7).font("Helvetica").text(employee.manager?.currentPosition?.title || "Pusat Studi Pendidikan dan Kebijakan", rightColX, sigY + 91);
  }

  // =========================================================================
  // FOOTER FORENSIK DI SEMUA HALAMAN (BUFFER PAGES)
  // =========================================================================
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

    // Garis pembatas footer
    doc.strokeColor(COLORS.border).lineWidth(0.5).moveTo(36, 808).lineTo(559, 808).stroke();

    // Teks kiri
    doc
      .fillColor(COLORS.slateLight)
      .fontSize(6.5)
      .font("Helvetica")
      .text("DOKUMEN RAHASIA & TERBATAS – INTERNAL PSPK", 36, 814);

    // Teks tengah
    doc
      .fillColor(COLORS.slateLight)
      .fontSize(6.5)
      .font("Helvetica")
      .text(`ID: DOC-${shortDocId} • Cetak: ${actor.name} • ${printTimestamp} WIB`, 36, 814, { align: "center", width: 523 });

    // Teks kanan
    doc
      .fillColor(COLORS.slateLight)
      .fontSize(6.5)
      .font("Helvetica")
      .text(`Halaman ${i + 1} dari ${range.count}`, 36, 814, { align: "right", width: 523 });
  }

  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on("error", (err) => {
      reject(err);
    });
  });
}
