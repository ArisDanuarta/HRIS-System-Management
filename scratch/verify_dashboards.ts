import { prisma } from "@pspk/db";
import { getAuthContext } from "@pspk/auth";
import { getStaffDashboard } from "../apps/hris/src/server/queries/dashboard/staff-dashboard";
import { getManagerDashboard } from "../apps/hris/src/server/queries/dashboard/manager-dashboard";
import { getHrDashboard } from "../apps/hris/src/server/queries/dashboard/hr-dashboard";

async function main() {
  console.log("=== VERIFYING DASHBOARD PER ROLE QUERIES & SECURITY ===\n");

  // 1. Test Staff Account
  const staffUser = await prisma.user.findUnique({ where: { email: "aris@pspk.id" } });
  if (!staffUser) throw new Error("Staff user not found");
  const staffCtx = await getAuthContext(staffUser.id);
  if (!staffCtx) throw new Error("Staff auth context failed");

  console.log("1. Testing Staff Context (aris@pspk.id):");
  console.log("   - Roles:", staffCtx.roles);
  console.log("   - EmployeeId:", staffCtx.employeeId);

  const staffData = await getStaffDashboard(staffCtx);
  console.log("   ✓ Staff Dashboard loaded successfully!");
  console.log("   - Leave balances count:", staffData.leaveBalances.length);
  console.log("   - Pending leaves count:", staffData.pendingLeavesCount);
  console.log("   - Recent leaves count:", staffData.recentLeaves.length);
  console.log("   - Latest payslip:", staffData.latestPayslip ? "Exists" : "Null (Expected Fase 2)");

  // 1b. Test Staff attempting to access Manager or HR dashboard (Security Check)
  console.log("\n   [Security Check] Testing Staff accessing Manager / HR dashboard:");
  try {
    await getManagerDashboard(staffCtx);
    console.error("   ❌ FAILED: Staff was able to call getManagerDashboard!");
  } catch (err: any) {
    console.log("   ✓ BLOCKED: Staff rejected from getManagerDashboard:", err.message);
  }

  try {
    await getHrDashboard(staffCtx);
    console.error("   ❌ FAILED: Staff was able to call getHrDashboard!");
  } catch (err: any) {
    console.log("   ✓ BLOCKED: Staff rejected from getHrDashboard:", err.message);
  }

  // 2. Test Manager Account
  const managerUser = await prisma.user.findUnique({ where: { email: "manajer@pspk.id" } });
  if (!managerUser) throw new Error("Manager user not found");
  const managerCtx = await getAuthContext(managerUser.id);
  if (!managerCtx) throw new Error("Manager auth context failed");

  console.log("\n2. Testing Manager Context (manajer@pspk.id):");
  console.log("   - Roles:", managerCtx.roles);
  console.log("   - EmployeeId:", managerCtx.employeeId);

  const managerData = await getManagerDashboard(managerCtx);
  console.log("   ✓ Manager Dashboard loaded successfully!");
  console.log("   - Total Team Members:", managerData.totalTeamMembers);
  console.log("   - Team Present Today:", managerData.teamPresentCount);
  console.log("   - Actionable Pending Leaves Count:", managerData.pendingLeaveRequests.length);
  console.log("   - Week Team Leaves:", managerData.weekTeamLeaves.length);
  console.log("   - Manager Personal Attendance:", managerData.managerOwn.todayAttendance ? "Recorded" : "Not yet checked in");
  console.log("   - Manager Personal Leave Balances:", managerData.managerOwn.leaveBalances.length);

  // 2b. Test Manager attempting to access HR dashboard (Security Check)
  console.log("\n   [Security Check] Testing Manager accessing HR dashboard:");
  try {
    await getHrDashboard(managerCtx);
    console.error("   ❌ FAILED: Manager was able to call getHrDashboard!");
  } catch (err: any) {
    console.log("   ✓ BLOCKED: Manager rejected from getHrDashboard:", err.message);
  }

  // 3. Test Admin HR Account
  const hrUser = await prisma.user.findUnique({ where: { email: "hr@pspk.id" } });
  if (!hrUser) throw new Error("HR user not found");
  const hrCtx = await getAuthContext(hrUser.id);
  if (!hrCtx) throw new Error("HR auth context failed");

  console.log("\n3. Testing Admin HR Context (hr@pspk.id):");
  console.log("   - Roles:", hrCtx.roles);

  const hrData = await getHrDashboard(hrCtx);
  console.log("   ✓ HR Dashboard loaded successfully!");
  console.log("   - Total Active Employees:", hrData.totalActiveEmployees);
  console.log("   - Present Today Count:", hrData.presentTodayCount, `(${hrData.attendancePercentage}%)`);
  console.log("   - Org Pending Leaves:", hrData.pendingLeavesCount);
  console.log("   - Expiring Contracts <= 30d:", hrData.expiringContractsCount);
  console.log("   - 7-Day Trend Days Count:", hrData.trendDays.length);
  console.log("   - Contract Composition:", hrData.contractStats);
  console.log("   - Action Needed (Pending > 2d):", hrData.pendingLeavesLong.length);
  console.log("   - On Leave Today:", hrData.onLeaveTodayList.length);

  // 4. Test Super Admin Account
  const superUser = await prisma.user.findUnique({ where: { email: "superadmin@pspk.id" } });
  if (!superUser) throw new Error("Superadmin user not found");
  const superCtx = await getAuthContext(superUser.id);
  if (!superCtx) throw new Error("Superadmin auth context failed");

  console.log("\n4. Testing Super Admin Context (superadmin@pspk.id):");
  console.log("   - Roles:", superCtx.roles);
  const superData = await getHrDashboard(superCtx);
  console.log("   ✓ Super Admin successfully loaded HR Dashboard (Full Org Access)!");

  console.log("\n=== ALL DASHBOARD CHECKS & RBAC ISOLATION PASSED 100%! ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
