"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PerformancePeriodSummary } from "@/server/queries/performance.queries";
import { PerformanceHeader } from "./performance-header";
import { PerformanceStatsCards } from "./performance-stats-cards";
import { PerformanceTable } from "./performance-table";
import { PerformanceReviewItem } from "./performance-detail-modal";

interface PerformanceClientWrapperProps {
  periods: PerformancePeriodSummary[];
  activePeriod: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  } | null;
  stats: {
    totalReviews: number;
    draftCount: number;
    selfReviewCount: number;
    managerReviewCount: number;
    finalizedCount: number;
    averageScore: number;
    completeGoalsCount: number;
    participationRate: number;
    completionRate: number;
  };
  reviews: PerformanceReviewItem[];
  departments: { id: string; name: string }[];
  isManager?: boolean;
  managerDepartmentName?: string;
  activeTab?: "team" | "mine";
  currentEmployeeId?: string;
  isHrOrAdmin?: boolean;
}

export function PerformanceClientWrapper({
  periods,
  activePeriod,
  stats,
  reviews,
  departments,
  isManager = false,
  managerDepartmentName,
  activeTab = "team",
  currentEmployeeId,
  isHrOrAdmin = false,
}: PerformanceClientWrapperProps) {
  const router = useRouter();

  const handleSelectPeriod = (periodId: string) => {
    const tabParam = isManager ? `&tab=${activeTab}` : "";
    router.push(`/kinerja?periodId=${periodId}${tabParam}`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <PerformanceHeader
        periods={periods}
        activePeriod={activePeriod}
        onSelectPeriod={handleSelectPeriod}
        isManager={isManager}
        managerDepartmentName={managerDepartmentName}
        activeTab={activeTab}
      />

      {/* Overview Stat Cards */}
      <PerformanceStatsCards stats={stats} />

      {/* Directory & Monitoring Table */}
      <PerformanceTable
        reviews={reviews}
        departments={departments}
        isManager={isManager}
        managerDepartmentName={managerDepartmentName}
        currentEmployeeId={currentEmployeeId}
        isHrOrAdmin={isHrOrAdmin}
      />
    </div>
  );
}
