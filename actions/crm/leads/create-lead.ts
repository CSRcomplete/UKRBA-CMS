"use server";
import { getSession } from "@/lib/auth-server";

export const createLead = async (data: {
  first_name?: string;
  last_name: string;
  company?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  description?: string;
  lead_source_id?: string;
  lead_status_id?: string;
  lead_type_id?: string;
  refered_by?: string;
  campaign?: string;
  assigned_to?: string;
  accountIDs?: string;
  website?: string;
}) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  return { error: "Manual lead creation is disabled. All leads must enter through approved Wix website integration." };
};
