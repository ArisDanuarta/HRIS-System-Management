import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import * as archiverModule from "archiver";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma, writeAudit } from "@pspk/db";
import { decryptField } from "@pspk/shared";
import { getStorageProvider } from "@pspk/storage";
import { getEmployeeById, getManagerTeamInfo } from "@/server/queries/employee.queries";
import { generateEmployeeProfilePdf } from "@/lib/pdf/employee-profile-pdf";

const createArchive: any = (archiverModule as any).default || archiverModule;

export const dynamic = "force-dynamic";

// Helper untuk mengubah stream Readable ke Buffer
async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Sesi login tidak valid atau telah berakhir." },
        { status: 401 },
      );
    }

    const actorProfile = await getUserProfile(session.user.id);
    const actorRoleKeys = actorProfile?.roles.map((r) => r.role.key) || [];
    const isSuperAdmin = actorRoleKeys.includes("super_admin");
    const isAdminHr = actorRoleKeys.includes("admin_hr");
    const isAdminIt = actorRoleKeys.includes("admin_it");
    const isManager = actorRoleKeys.includes("manager");
    const isHrOrAdmin = isSuperAdmin || isAdminHr;

    const currentActorEmployee = actorProfile?.employee || null;
    const managerTeamInfo =
      isManager && currentActorEmployee ? await getManagerTeamInfo(currentActorEmployee.id) : null;

    // Ambil data lengkap pegawai
    const employee = await getEmployeeById(id);
    if (!employee) {
      return NextResponse.json(
        { message: "Data karyawan tidak ditemukan." },
        { status: 404 },
      );
    }

    // Proteksi Akses Berbasis Peran:
    // Manager hanya berhak mengakses jika melihat diri sendiri, bawahan langsung, atau anggota divisinya
    if (isManager && !isHrOrAdmin && !isAdminIt) {
      const isSelf = currentActorEmployee?.id === employee.id;
      const isDirectReport = employee.managerId === currentActorEmployee?.id;
      const isSameDepartment =
        Boolean(managerTeamInfo?.currentDepartmentId) &&
        employee.currentDepartmentId === managerTeamInfo?.currentDepartmentId;

      if (!isSelf && !isDirectReport && !isSameDepartment) {
        return NextResponse.json(
          { message: "Anda tidak memiliki wewenang untuk mengekspor data profil pegawai ini." },
          { status: 403 },
        );
      }
    } else if (!isSuperAdmin && !isAdminHr && !isAdminIt && !isManager) {
      // Staff biasa hanya boleh jika melihat dirinya sendiri
      if (currentActorEmployee?.id !== employee.id) {
        return NextResponse.json(
          { message: "Akses ditolak. Fitur ekspor profil hanya untuk staf berwenang." },
          { status: 403 },
        );
      }
    }

    // Baca Parameter Request
    const { searchParams } = new URL(request.url);
    const personal = searchParams.get("personal") !== "false";
    const address = searchParams.get("address") !== "false";
    const family = searchParams.get("family") !== "false";
    const education = searchParams.get("education") !== "false";
    const employment = searchParams.get("employment") !== "false";
    const contracts = searchParams.get("contracts") !== "false";
    const attendance = searchParams.get("attendance") !== "false";
    const documents = searchParams.get("documents") !== "false";
    const assets = searchParams.get("assets") !== "false";

    // Proteksi Server-Side: Manager tidak pernah diizinkan membuka data sensitif & kompensasi
    const canAccessSensitive = isHrOrAdmin && !isManager;
    const sensitive = canAccessSensitive && searchParams.get("sensitive") === "true";
    const compensation = canAccessSensitive && searchParams.get("compensation") === "true";

    const attendanceFrom = searchParams.get("attendanceFrom") || undefined;
    const attendanceTo = searchParams.get("attendanceTo") || undefined;
    const format = searchParams.get("format") === "zip" ? "zip" : "pdf";

    // Jika data sensitif dibuka, dekripsi nilai mentah untuk dicetak
    let nikRaw: string | null = null;
    let npwpRaw: string | null = null;
    let bankAccountRaw: string | null = null;

    if (sensitive) {
      // Query raw ciphertext dari database untuk didekripsi
      const rawEnc = await prisma.employee.findUnique({
        where: { id },
        select: {
          nikEnc: true,
          npwpEnc: true,
          bankAccountEnc: true,
        },
      });

      if (rawEnc?.nikEnc) {
        try {
          nikRaw = decryptField(rawEnc.nikEnc);
        } catch {
          nikRaw = employee.nikMasked;
        }
      }
      if (rawEnc?.npwpEnc) {
        try {
          npwpRaw = decryptField(rawEnc.npwpEnc);
        } catch {
          npwpRaw = employee.npwpMasked;
        }
      }
      if (rawEnc?.bankAccountEnc) {
        try {
          bankAccountRaw = decryptField(rawEnc.bankAccountEnc);
        } catch {
          bankAccountRaw = employee.bankAccountMasked;
        }
      }
    }

    // Ambil data absensi jika diminta
    let attendanceData: any = undefined;
    if (attendance) {
      const fromDate = attendanceFrom ? new Date(attendanceFrom) : new Date(Date.now() - 30 * 86400000);
      const toDate = attendanceTo ? new Date(attendanceTo) : new Date();
      toDate.setHours(23, 59, 59, 999);

      const [attendances, leaveBalances] = await Promise.all([
        prisma.attendance.findMany({
          where: {
            employeeId: id,
            date: {
              gte: fromDate,
              lte: toDate,
            },
          },
          orderBy: { date: "desc" },
        }),
        prisma.leaveBalance.findMany({
          where: {
            employeeId: id,
            year: new Date().getFullYear(),
          },
          include: { leaveType: true },
        }),
      ]);

      const presentCount = attendances.filter((a: any) => a.status === "PRESENT").length;
      const lateCount = attendances.filter((a: any) => a.status === "LATE").length;
      const wfhCount = attendances.filter((a: any) => a.status === "WFH").length;
      const leaveCount = attendances.filter((a: any) => a.status === "LEAVE").length;
      const absentCount = attendances.filter((a: any) => a.status === "ABSENT").length;
      const recordedDays = attendances.length;
      const effectivePresent = presentCount + lateCount + wfhCount;
      const attendanceRate =
        recordedDays > 0 ? Math.round((effectivePresent / recordedDays) * 100) : 100;

      attendanceData = {
        summary: {
          workingDaysCount: recordedDays,
          presentCount,
          lateCount,
          wfhCount,
          leaveCount,
          absentCount,
          attendanceRate,
        },
        records: attendances,
        leaveBalances: leaveBalances.map((lb: any) => ({
          leaveTypeName: lb.leaveType.name,
          quotaDays: lb.quotaDays,
          usedDays: lb.usedDays,
          remainingDays: lb.remainingDays,
        })),
      };
    }

    // Ambil aset inventaris aktif jika diminta
    let activeAssets: any[] = [];
    if (assets) {
      const rawAssets = await prisma.assetAssignment.findMany({
        where: {
          employeeId: id,
          returnedAt: null,
        },
        include: { asset: true },
        orderBy: { assignedAt: "desc" },
      });

      activeAssets = rawAssets.map((a: any) => ({
        assetTag: a.asset.assetTag,
        name: a.asset.name,
        brand: a.asset.brand,
        model: a.asset.model,
        assignedAt: a.assignedAt,
        conditionOut: a.conditionOut || "Baik",
      }));
    }

    // Hasilkan Buffer PDF Utama
    const pdfBuffer = await generateEmployeeProfilePdf({
      employee: {
        ...employee,
        nikRaw,
        npwpRaw,
        bankAccountRaw,
      },
      actor: {
        name: actorProfile?.employee?.fullName || session.user.name || "Administrator HR",
        email: session.user.email,
        role: actorRoleKeys.join(", "),
      },
      options: {
        personal,
        address,
        family,
        education,
        employment,
        contracts,
        attendance,
        documents,
        assets,
        sensitive,
        compensation,
        attendanceFrom,
        attendanceTo,
      },
      attendanceData,
      activeAssets,
    });

    // Catat Log Audit Forensik
    const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip");
    const userAgent = reqHeaders.get("user-agent");

    await writeAudit({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      app: "hris",
      action: "EXPORT",
      entityType: "EmployeeProfile",
      entityId: employee.id,
      before: undefined,
      after: {
        employeeNo: employee.employeeNo,
        employeeName: employee.fullName,
        format,
        sensitiveIncluded: sensitive,
        compensationIncluded: compensation,
      },
      ip,
      userAgent,
    });

    if (sensitive) {
      await writeAudit({
        actorUserId: session.user.id,
        actorEmail: session.user.email,
        app: "hris",
        action: "VIEW_SENSITIVE",
        entityType: "EmployeeSensitiveFields",
        entityId: employee.id,
        before: undefined,
        after: {
          fieldsAccessed: ["nik", "npwp", "bankAccount"],
          reason: "Ekspor Profil Lengkap PDF Berkas Kepegawaian",
        },
        ip,
        userAgent,
      });
    }

    const sanitizedName = employee.fullName.replace(/[^a-zA-Z0-9_-]/g, "_");

    // =========================================================================
    // KASUS 1: Unduhan Format PDF Tunggal
    // =========================================================================
    if (format !== "zip") {
      const fileName = `Profil_Lengkap_${employee.employeeNo}_${sanitizedName}.pdf`;

      return new NextResponse(pdfBuffer as any, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Length": String(pdfBuffer.length),
        },
      });
    }

    // =========================================================================
    // KASUS 2: Unduhan Paket Arsip ZIP (.zip) Lengkap dengan Berkas Lampiran
    // =========================================================================
    const archive = createArchive("zip", {
      zlib: { level: 6 },
    });

    const zipBuffers: Buffer[] = [];
    archive.on("data", (chunk: Buffer) => zipBuffers.push(chunk));

    // 1. Masukkan PDF Utama ke dalam Root ZIP
    archive.append(pdfBuffer, {
      name: `${employee.employeeNo}_${sanitizedName}_Profil_Resmi.pdf`,
    });

    // 2. Kumpulkan Dokumen Fisik Asli dari Storage ke Folder Dokumen_Lampiran/
    if (documents && employee.documents && employee.documents.length > 0) {
      const storage = getStorageProvider();

      for (let i = 0; i < employee.documents.length; i++) {
        const docItem = employee.documents[i];
        if (!docItem?.fileKey) continue;

        try {
          const fileRes = await storage.get(docItem.fileKey);
          if (fileRes && fileRes.stream) {
            const fileData = await streamToBuffer(fileRes.stream);
            const indexPrefix = String(i + 1).padStart(2, "0");
            const safeCategory = (docItem.category || "DOKUMEN").replace(/[^a-zA-Z0-9_-]/g, "_");
            const safeFileName = docItem.fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
            const zipPath = `Dokumen_Lampiran/${indexPrefix}_${safeCategory}_${safeFileName}`;

            archive.append(fileData, { name: zipPath });
          }
        } catch (err) {
          console.warn(`Gagal menyertakan berkas lampiran ${docItem.fileKey} ke ZIP:`, err);
        }
      }
    }

    // Selesaikan arsip
    await archive.finalize();

    const finalZipBuffer = Buffer.concat(zipBuffers);
    const zipFileName = `Paket_Arsip_Kepegawaian_${employee.employeeNo}_${sanitizedName}.zip`;

    return new NextResponse(finalZipBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFileName}"`,
        "Content-Length": String(finalZipBuffer.length),
      },
    });
  } catch (error) {
    console.error("Kesalahan internal saat memproses ekspor profil:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan sistem saat memproses ekspor profil karyawan.",
      },
      { status: 500 },
    );
  }
}
