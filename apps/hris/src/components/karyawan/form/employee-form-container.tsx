"use client";

import React from "react";
import { EmployeeFormProvider } from "./employee-form.context";
import { EmployeeWizardCreate } from "./employee-wizard-create";
import { EmployeeWorkspaceEdit } from "./employee-workspace-edit";
import { WizardEmployeeFormProps } from "./types";

export function EmployeeFormContainer(props: WizardEmployeeFormProps) {
  return (
    <EmployeeFormProvider props={props}>
      {props.mode === "create" ? <EmployeeWizardCreate /> : <EmployeeWorkspaceEdit />}
    </EmployeeFormProvider>
  );
}

export { EmployeeFormContainer as WizardEmployeeForm };
