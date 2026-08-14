"use client";

import { Badge } from "@econmesh-app/ui/components/badge";

import { COMPLIANCE_STATUS_LABELS, complianceStatus } from "@/modules/companies/schemas";
import type { CompanyComplianceFile } from "@/types/api";

export function DocumentStatusBadge({ file }: { file?: CompanyComplianceFile | null }) {
  if (!file) return null;
  const status = complianceStatus(file);
  const className =
    status === "approved"
      ? undefined
      : status === "rejected"
        ? "border-transparent bg-destructive/15 text-destructive"
        : undefined;
  const variant = status === "approved" ? "success" : status === "pending" ? "warning" : "outline";
  return (
    <Badge variant={variant} className={className}>
      {COMPLIANCE_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
