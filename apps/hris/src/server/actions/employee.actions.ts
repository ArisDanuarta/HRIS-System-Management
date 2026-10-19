"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession, getAuthContext } from "@pspk/auth";
import { assertCan, AuthContext } from "@pspk/rbac";
import { extractClientIp, encryptField } from "@pspk/shared";
import { getStorageProvider } from "@pspk/storage";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  unmaskFieldSchema,
  attachContractDocumentSchema,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  UnmaskFieldInput,
} from "../schemas/employee.schema";
import { prisma } from "@pspk/db";
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  reactivateEmployee,
  unmaskSensitiveField,
  attachContractDocument,
  ActorContext,
} from "../services/employee.service";

export async function generateNextEmployeeNoAction(joinDate?: string) {
  try {
    const { authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.write:all");

    // Format target: PSPK-YYYYMM-XXX
    let year = new Date().getFullYear();
    let month = String(new Date().getMonth() + 1).padStart(2, "0");

    if (joinDate && joinDate.trim() !== "") {
      const parts = joinDate.split("-");
      if (parts[0] && parts[1]) {
        year = parseInt(parts[0], 10) || year;
        month = String(parseInt(parts[1], 10) || month).padStart(2, "0");
      }
    }

    const prefix = `PSPK-${year}${month}-`;

    const existing = await prisma.employee.findMany({
      where: {
        employeeNo: { startsWith: prefix },
      },
      select: { employeeNo: true },
    });

    let maxSeq = 0;
    for (const emp of existing) {
      const parts = emp.employeeNo.split("-");
      const seqPart = parts[2];
      if (seqPart) {
        const num = parseInt(seqPart, 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }

    let nextSeq = maxSeq + 1;
    let candidate = `${prefix}${String(nextSeq).padStart(3, "0")}`;

    // Verifikasi agar tidak ada bentrok
    let exists = await prisma.employee.findUnique({
      where: { employeeNo: candidate },
    });
    while (exists) {
      nextSeq++;
      candidate = `${prefix}${String(nextSeq).padStart(3, "0")}`;
      exists = await prisma.employee.findUnique({
        where: { employeeNo: candidate },
      });
    }

    return {
      ok: true as const,
      data: { employeeNo: candidate },
    };
  } catch (err: unknown) {
    console.error("generateNextEmployeeNoAction error:", err);
    const msg = err instanceof Error ? err.message : "Gagal membuat NIP otomatis.";
    return { ok: false as const, error: msg };
  }
}

export async function checkEmployeeNoAvailabilityAction(
  employeeNo: string,
  currentEmployeeId?: string,
) {
  try {
    const trimmed = employeeNo.trim();
    if (!trimmed || trimmed.length < 3) {
      return { ok: false as const, error: "NIP terlalu pendek (minimal 3 karakter)." };
    }

    const existing = await prisma.employee.findUnique({
      where: { employeeNo: trimmed },
      select: { id: true, fullName: true, employeeNo: true },
    });

    if (existing && existing.id !== currentEmployeeId) {
      return {
        ok: true as const,
        available: false,
        message: `NIP '${trimmed}' sudah digunakan oleh ${existing.fullName}.`,
        existingName: existing.fullName,
      };
    }

    return {
      ok: true as const,
      available: true,
      message: `NIP '${trimmed}' tersedia dan dapat digunakan.`,
    };
  } catch (err: unknown) {
    console.error("checkEmployeeNoAvailabilityAction error:", err);
    return { ok: false as const, error: "Gagal memeriksa ketersediaan NIP." };
  }
}

async function getAuthenticatedActor(): Promise<{ actor: ActorContext; authCtx: AuthContext }> {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    throw new Error("Sesi Anda telah kedaluwarsa. Silakan masuk kembali.");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    throw new Error("Pengguna tidak aktif atau hak akses tidak valid.");
  }

  const clientIp = extractClientIp(reqHeaders);
  const userAgent = reqHeaders.get("user-agent") || null;

  return {
    actor: {
      id: session.user.id,
      email: session.user.email,
      ip: clientIp,
      userAgent,
    },
    authCtx,
  };
}

export async function createEmployeeAction(input: CreateEmployeeInput) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.write:all");

    const parsed = createEmployeeSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Validasi data pegawai gagal.";
      return { ok: false as const, error: errorMsg };
    }

    const {
      employee: newEmp,
      accountCreated,
      credentials,
    } = await createEmployee(parsed.data, actor);
    revalidatePath("/karyawan");

    return {
      ok: true as const,
      data: {
        id: newEmp.id,
        employeeNo: newEmp.employeeNo,
        fullName: newEmp.fullName,
        accountCreated,
        credentials,
      },
      message: `Pegawai ${newEmp.fullName} (${newEmp.employeeNo}) berhasil ditambahkan.`,
    };
  } catch (err: unknown) {
    console.error("createEmployeeAction error:", err);
    const errorMsg = err instanceof Error ? err.message : "Gagal menambahkan pegawai.";
    return { ok: false as const, error: errorMsg };
  }
}

export async function updateEmployeeAction(input: UpdateEmployeeInput) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.write:all");

    const parsed = updateEmployeeSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Validasi data pegawai gagal.";
      return { ok: false as const, error: errorMsg };
    }

    const updated = await updateEmployee(parsed.data, actor);
    revalidatePath("/karyawan");
    revalidatePath(`/karyawan/${updated.id}`);
    revalidatePath(`/karyawan/${updated.id}/ubah`);
    revalidatePath("/profil");
    revalidatePath("/dashboard");
    revalidatePath("/kinerja");
    revalidatePath("/notifikasi");

    return {
      ok: true as const,
      data: { id: updated.id },
      message: `Data pegawai ${updated.fullName} berhasil diperbarui.`,
    };
  } catch (err: unknown) {
    console.error("updateEmployeeAction error:", err);
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui data pegawai.";
    return { ok: false as const, error: errorMsg };
  }
}

export async function deleteEmployeeAction(id: string) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.write:all");

    const deleted = await deleteEmployee(id, actor);
    revalidatePath("/karyawan");
    revalidatePath(`/karyawan/${id}`);
    revalidatePath("/dashboard");

    return {
      ok: true as const,
      data: { id: deleted.id },
      message: `Pegawai ${deleted.fullName} berhasil dinonaktifkan.`,
    };
  } catch (err: unknown) {
    console.error("deleteEmployeeAction error:", err);
    const errorMsg = err instanceof Error ? err.message : "Gagal menonaktifkan pegawai.";
    return { ok: false as const, error: errorMsg };
  }
}

export async function reactivateEmployeeAction(id: string) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.write:all");

    const reactivated = await reactivateEmployee(id, actor);
    revalidatePath("/karyawan");
    revalidatePath(`/karyawan/${id}`);
    revalidatePath("/dashboard");

    return {
      ok: true as const,
      data: { id: reactivated.id },
      message: `Pegawai ${reactivated.fullName} berhasil diaktifkan kembali.`,
    };
  } catch (err: unknown) {
    console.error("reactivateEmployeeAction error:", err);
    const errorMsg = err instanceof Error ? err.message : "Gagal mengaktifkan kembali pegawai.";
    return { ok: false as const, error: errorMsg };
  }
}

export async function uploadContractFileAction(formData: FormData) {
  try {
    const { authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.write:all");

    const file = formData.get("file") as File | null;
    const employeeId = ((formData.get("employeeId") as string) || "temp").trim();

    if (!file || !(file instanceof File) || file.size === 0) {
      return { ok: false as const, error: "Berkas kontrak kerja wajib dipilih." };
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return { ok: false as const, error: "Format berkas harus berupa dokumen PDF (.pdf)." };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { ok: false as const, error: "Ukuran berkas kontrak maksimal 10 MB." };
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storageKey = `contracts/${employeeId}_${Date.now()}_${safeFileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const storage = getStorageProvider();
    await storage.put(storageKey, buffer, { contentType: "application/pdf" });

    return {
      ok: true as const,
      data: {
        documentKey: storageKey,
        fileName: file.name,
        fileSize: file.size,
      },
      message: "Berkas kontrak kerja berhasil diunggah.",
    };
  } catch (err: unknown) {
    console.error("uploadContractFileAction error:", err);
    const msg = err instanceof Error ? err.message : "Gagal mengunggah berkas kontrak.";
    return { ok: false as const, error: msg };
  }
}

export async function attachContractDocumentAction(formData: FormData) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.write:all");

    const contractId = (formData.get("contractId") as string)?.trim();
    const employeeId = (formData.get("employeeId") as string)?.trim();
    const contractNumber = (formData.get("contractNumber") as string)?.trim() || "";
    let notes = (formData.get("notes") as string)?.trim() || "";
    let documentKey = (formData.get("documentKey") as string)?.trim() || "";
    const file = formData.get("file") as File | null;

    if (!contractId || !employeeId) {
      return { ok: false as const, error: "Parameter kontrak atau pegawai tidak lengkap." };
    }

    // Jika berkas baru diunggah secara langsung
    if (file && file instanceof File && file.size > 0) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        return { ok: false as const, error: "Format berkas harus berupa dokumen PDF (.pdf)." };
      }
      if (file.size > 10 * 1024 * 1024) {
        return { ok: false as const, error: "Ukuran berkas kontrak maksimal 10 MB." };
      }

      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storageKey = `contracts/${employeeId}_${Date.now()}_${safeFileName}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const storage = getStorageProvider();
      await storage.put(storageKey, buffer, { contentType: "application/pdf" });
      documentKey = storageKey;
    }

    if (!documentKey) {
      return { ok: false as const, error: "Berkas PDF kontrak kerja wajib diunggah." };
    }

    // Format catatan dengan nomor kontrak jika diisi
    if (contractNumber) {
      if (notes.startsWith("[Nomor:")) {
        const endBracketIdx = notes.indexOf("]");
        const rest = endBracketIdx !== -1 ? notes.slice(endBracketIdx + 1).trim() : "";
        notes = `[Nomor: ${contractNumber}] ${rest}`.trim();
      } else {
        notes = `[Nomor: ${contractNumber}] ${notes}`.trim();
      }
    }

    const validated = attachContractDocumentSchema.parse({
      contractId,
      employeeId,
      documentKey,
      notes: notes || undefined,
    });

    const result = await attachContractDocument(validated, actor);

    revalidatePath("/karyawan");
    revalidatePath(`/karyawan/${employeeId}`);

    return {
      ok: true as const,
      data: result,
      message: "Berkas kontrak kerja berhasil ditautkan ke data pegawai.",
    };
  } catch (err: unknown) {
    console.error("attachContractDocumentAction error:", err);
    const msg = err instanceof Error ? err.message : "Gagal menyimpan berkas kontrak kerja.";
    return { ok: false as const, error: msg };
  }
}

export async function unmaskSensitiveFieldAction(input: UnmaskFieldInput) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.read:all");

    const parsed = unmaskFieldSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false as const, error: "Permintaan data tidak valid." };
    }

    const result = await unmaskSensitiveField(parsed.data.employeeId, parsed.data.field, actor);

    return {
      ok: true as const,
      data: result,
    };
  } catch (err: unknown) {
    console.error("unmaskSensitiveFieldAction error:", err);
    const errorMsg = err instanceof Error ? err.message : "Gagal membuka data sensitif.";
    return { ok: false as const, error: errorMsg };
  }
}

export type ImportEmployeeRow = {
  fullName: string;
  nickname?: string;
  employeeNo: string;
  workEmail: string;
  personalEmail?: string;
  phone?: string;
  departmentName: string;
  positionTitle: string;
  employmentType?: "PERMANENT" | "FIXED_TERM" | "PART_TIME_PROJECT";
  employmentTypeNameOrCode?: string;
  wageType?: "MONTHLY" | "HOURLY";
  baseSalary?: number;
  hourlyRate?: number;
  joinDate: string;
  contractEndDate?: string;
  gender?: "MALE" | "FEMALE";
  maritalStatus?: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
};

export async function importEmployeesBatchAction(rows: ImportEmployeeRow[]) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.import:all");

    if (!rows || rows.length === 0) {
      return { ok: false as const, error: "Tidak ada baris data yang diunggah." };
    }

    const { prisma, writeAudit } = await import("@pspk/db");

    // Pre-fetch departments and master employment types
    const [departments, employmentTypes] = await Promise.all([
      prisma.department.findMany({
        include: { positions: true },
      }),
      prisma.employmentTypeMaster.findMany(),
    ]);

    const results = await prisma.$transaction(async (tx) => {
      let importedCount = 0;
      const failedRows: { row: number; reason: string }[] = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!r) continue;

        // Check if NIP or email already exists
        const existing = await tx.employee.findFirst({
          where: {
            OR: [
              { employeeNo: r.employeeNo.trim() },
              { workEmail: r.workEmail.toLowerCase().trim() },
            ],
          },
        });

        if (existing) {
          failedRows.push({
            row: i + 1,
            reason: `NIP ${r.employeeNo} atau Email ${r.workEmail} sudah ada di database`,
          });
          continue;
        }

        // Find or create department
        const dept = departments.find(
          (d) => d.name.toLowerCase() === r.departmentName.trim().toLowerCase(),
        );
        let deptId = dept?.id;
        if (!deptId) {
          const newDept = await tx.department.create({
            data: { name: r.departmentName.trim() },
          });
          deptId = newDept.id;
        }

        // Find or create position
        const pos = dept?.positions.find(
          (p) => p.title.toLowerCase() === r.positionTitle.trim().toLowerCase(),
        );
        let posId = pos?.id;
        if (!posId) {
          const newPos = await tx.position.create({
            data: { title: r.positionTitle.trim(), departmentId: deptId },
          });
          posId = newPos.id;
        }

        // Match employment type master if given
        let matchedType = null;
        if (r.employmentTypeNameOrCode && r.employmentTypeNameOrCode.trim() !== "") {
          const needle = r.employmentTypeNameOrCode.trim().toLowerCase();
          matchedType = employmentTypes.find(
            (et) =>
              et.name.toLowerCase() === needle ||
              et.code.toLowerCase() === needle ||
              et.category.toLowerCase() === needle,
          );
        }

        const contractType = matchedType ? matchedType.category : r.employmentType || "PERMANENT";
        const wageType = matchedType ? matchedType.wageType : r.wageType || "MONTHLY";
        const hourlyRate =
          wageType === "HOURLY"
            ? r.hourlyRate
              ? Number(r.hourlyRate)
              : matchedType?.defaultHourlyRate
                ? Number(matchedType.defaultHourlyRate)
                : 30000
            : null;
        const baseSalary =
          wageType === "HOURLY" ? null : r.baseSalary ? Number(r.baseSalary) : 10000000;

        let contractEndDate: Date | null = null;
        if (r.contractEndDate && r.contractEndDate.trim() !== "") {
          const parsedEnd = new Date(r.contractEndDate);
          if (!isNaN(parsedEnd.getTime())) {
            contractEndDate = parsedEnd;
          }
        }

        // Enkripsi nomor rekening jika disediakan
        const bankAccountEnc =
          r.bankAccount && r.bankAccount.trim() !== "" ? encryptField(r.bankAccount.trim()) : null;

        // Create employee
        await tx.employee.create({
          data: {
            employeeNo: r.employeeNo.trim(),
            fullName: r.fullName.trim(),
            nickname: r.nickname?.trim() || null,
            workEmail: r.workEmail.toLowerCase().trim(),
            personalEmail: r.personalEmail?.trim() || null,
            phone: r.phone?.trim() || null,
            gender: r.gender || "MALE",
            maritalStatus: r.maritalStatus || "SINGLE",
            joinDate: new Date(r.joinDate),
            status: "ACTIVE",
            currentDepartmentId: deptId,
            currentPositionId: posId,
            bankName: r.bankName?.trim() || null,
            bankAccountEnc,
            bankAccountName: r.bankAccountName?.trim() || null,
            contracts: {
              create: {
                type: contractType,
                employmentTypeId: matchedType?.id || null,
                wageType: wageType,
                hourlyRate: hourlyRate,
                startDate: new Date(r.joinDate),
                endDate: contractEndDate,
                baseSalary: baseSalary,
                status: "ACTIVE",
                notes: "Diimpor massal dari spreadsheet Excel (.xlsx)",
              },
            },
            histories: {
              create: {
                departmentId: deptId,
                positionId: posId,
                startDate: new Date(r.joinDate),
                notes: "Penempatan awal via impor massal",
              },
            },
          },
        });

        importedCount++;
      }

      await writeAudit(
        {
          actorUserId: actor.id,
          actorEmail: actor.email,
          app: "hris",
          action: "IMPORT",
          entityType: "Employee",
          before: { totalSubmittedRows: rows.length },
          after: { importedCount, failedCount: failedRows.length },
          ip: actor.ip,
          userAgent: actor.userAgent,
        },
        tx,
      );

      return { importedCount, failedRows };
    });

    revalidatePath("/karyawan");

    return {
      ok: true as const,
      data: results,
      message: `Berhasil mengimpor ${results.importedCount} pegawai.`,
    };
  } catch (err: unknown) {
    console.error("importEmployeesBatchAction error:", err);
    const errorMsg = err instanceof Error ? err.message : "Gagal mengimpor data pegawai.";
    return { ok: false as const, error: errorMsg };
  }
}
