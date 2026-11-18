/**
 * WizardEmployeeForm Re-export
 *
 * Komponen ini telah direfaktor menjadi arsitektur modular berstandar enterprise:
 * - Mode "create": EmployeeWizardCreate (5-Step Guided Wizard + Review 360°)
 * - Mode "edit": EmployeeWorkspaceEdit (Non-linear Category Workspace + Dirty Tracker + Sticky Save)
 *
 * Seluruh kode terkelola secara bersih di `apps/hris/src/components/karyawan/form/`.
 */

export {
  EmployeeFormContainer as WizardEmployeeForm,
} from "./form/employee-form-container";

export type {
  RoleOption,
  EmploymentTypeOption,
  InitialEmployeeData,
  WorkLocationOption,
  LegalEntityOption,
  WizardEmployeeFormProps,
} from "./form/types";
