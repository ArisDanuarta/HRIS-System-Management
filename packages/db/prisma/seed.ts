import { PrismaClient } from "@prisma/client";
import { PERMISSIONS, SYSTEM_ROLES } from "@pspk/rbac";
import crypto from "node:crypto";

const prisma = new PrismaClient();

// Helper to hash password using PBKDF2 (compatible with standard credential stores)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("🌱 Memulai proses seeding database PSPK Platform...");

  // 1. Seed Permissions
  console.log(`📦 Seeding ${PERMISSIONS.length} permissions...`);
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        module: perm.module,
        description: perm.description,
      },
      create: {
        key: perm.key,
        module: perm.module,
        description: perm.description,
      },
    });
  }

  // 2. Seed Roles & RolePermissions
  console.log(`🛡️ Seeding ${SYSTEM_ROLES.length} system roles...`);
  for (const roleDef of SYSTEM_ROLES) {
    const role = await prisma.role.upsert({
      where: { key: roleDef.key },
      update: {
        name: roleDef.name,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
      create: {
        key: roleDef.key,
        name: roleDef.name,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
    });

    // Sync permissions for this role
    for (const permKey of roleDef.permissions) {
      const permission = await prisma.permission.findUnique({ where: { key: permKey } });
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }
  }

  // 3. Seed Super Admin User
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@pspk.example";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "AdminPSPK2026!#";

  console.log(`👤 Seeding super admin: ${adminEmail}...`);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Super Administrator PSPK",
      isActive: true,
      emailVerified: true,
    },
    create: {
      email: adminEmail,
      name: "Super Administrator PSPK",
      isActive: true,
      emailVerified: true,
    },
  });

  // Create password credential account if not exists
  const existingAccount = await prisma.account.findFirst({
    where: {
      userId: adminUser.id,
      providerId: "credential",
    },
  });

  if (!existingAccount) {
    await prisma.account.create({
      data: {
        userId: adminUser.id,
        accountId: adminUser.id,
        providerId: "credential",
        password: hashPassword(adminPassword),
      },
    });
  }

  // Assign super_admin role
  const superAdminRole = await prisma.role.findUnique({ where: { key: "super_admin" } });
  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
      },
    });
  }

  // 4. Seed Default Leave Types
  console.log("🏖️ Seeding default leave types...");
  const defaultLeaveTypes = [
    { name: "Cuti Tahunan", defaultQuotaDays: 12, isPaid: true, requiresAttachment: false },
    { name: "Cuti Sakit", defaultQuotaDays: 14, isPaid: true, requiresAttachment: true },
    { name: "Cuti Melahirkan", defaultQuotaDays: 90, isPaid: true, requiresAttachment: true },
    { name: "Cuti Penting", defaultQuotaDays: 5, isPaid: true, requiresAttachment: false },
  ];

  for (const lt of defaultLeaveTypes) {
    const existing = await prisma.leaveType.findFirst({ where: { name: lt.name } });
    if (!existing) {
      await prisma.leaveType.create({ data: lt });
    }
  }

  console.log("✅ Seeding selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
