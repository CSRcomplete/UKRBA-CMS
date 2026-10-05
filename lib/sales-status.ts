import { SalesStatus } from "@prisma/client";

export const SALES_STATUS_VALUES: SalesStatus[] = ["basic", "verified", "accredited", "premium", "white_label"];

export const SALES_STATUS_LABELS: Record<SalesStatus, string> = {
  basic: "Basic",
  verified: "Verified",
  accredited: "Accredited",
  premium: "Premium",
  white_label: "White Label",
};
