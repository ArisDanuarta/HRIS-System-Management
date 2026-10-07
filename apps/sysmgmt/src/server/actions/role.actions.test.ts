import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  updateRolePermissionsAction,
  batchUpdateRoleMatrixAction,
  resetRolePermissionsToDefaultAction,
  updatePermissionDescriptionAction,
} from "./role.actions";

// Mock dependencies
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers({ "user-agent": "Vitest-Agent" })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockSession = {
  user: {
    id: "user-superadmin-1",
    email: "superadmin@pspk.id",
    name: "Super Administrator PSPK",
  },
};

const mockAuthCtx = {
  userId: "user-superadmin-1",
  employeeId: null,
  roles: ["super_admin"],
  permissions: new Set(["sysmgmt.role.manage:all"]),
};

vi.mock("@pspk/auth", () => ({
  getSession: vi.fn().mockImplementation(() => Promise.resolve(mockSession)),
  getAuthContext: vi.fn().mockImplementation(() => Promise.resolve(mockAuthCtx)),
}));

vi.mock("@pspk/db", () => {
  return {
    prisma: {
      role: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      permission: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      rolePermission: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      $transaction: vi.fn(async (callback) => {
        const tx = {
          role: {
            findUnique: vi.fn(),
          },
          permission: {
            update: vi.fn(),
          },
          rolePermission: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
        };
        return await callback(tx);
      }),
    },
    writeAudit: vi.fn().mockResolvedValue(undefined),
  };
});

describe("Server Actions: Role & Permissions Mutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateRolePermissionsAction", () => {
    it("menolak keras upaya pengurangan atau modifikasi wewenang Super Admin", async () => {
      const result = await updateRolePermissionsAction({
        roleKey: "super_admin",
        permissionKeys: ["hris.leave.read:own"],
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain("Super Admin bersifat permanen");
    });
  });

  describe("batchUpdateRoleMatrixAction", () => {
    it("menolak eksekusi jika array updates kosong", async () => {
      const result = await batchUpdateRoleMatrixAction({
        updates: [],
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain("Tidak ada data perubahan");
    });

    it("menolak eksekusi jika seluruh entri update hanya menargetkan Super Admin", async () => {
      const result = await batchUpdateRoleMatrixAction({
        updates: [
          {
            roleKey: "super_admin",
            permissionKeys: ["hris.leave.read:own"],
          },
        ],
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain("tidak dapat diterapkan pada peran Super Admin");
    });
  });

  describe("resetRolePermissionsToDefaultAction", () => {
    it("menolak reset wewenang jika peran yang diminta adalah Super Admin", async () => {
      const result = await resetRolePermissionsToDefaultAction({
        roleKey: "super_admin",
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain("Peran Super Admin terkunci otomatis");
    });
  });

  describe("updatePermissionDescriptionAction", () => {
    it("menolak deskripsi yang kosong atau hanya spasi", async () => {
      const result = await updatePermissionDescriptionAction({
        permissionKey: "hris.leave.read:own",
        description: "   ",
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain("tidak boleh kosong");
    });
  });
});
