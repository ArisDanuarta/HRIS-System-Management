"use client";

import React, { useState } from "react";
import { PayrollPeriodTable, PeriodItem } from "@/components/payroll/payroll-period-table";
import { CreatePeriodModal } from "@/components/payroll/create-period-modal";

interface PayrollClientWrapperProps {
  periods: PeriodItem[];
}

export function PayrollClientWrapper({ periods }: PayrollClientWrapperProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <PayrollPeriodTable periods={periods} onOpenCreateModal={() => setModalOpen(true)} />
      <CreatePeriodModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
