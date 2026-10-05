"use server";

import { uploadLeads } from "./upload-leads";

export const createLead = async (data: {
  first_name?: string;
  last_name: string;
  company?: string;
  email?: string;
  phone?: string;
  postcode?: string;
}) => {
  const result = await uploadLeads([
    {
      firstName: data.first_name,
      lastName: data.last_name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      postcode: data.postcode,
    },
  ]);

  if (result.error) {
    return { error: result.error };
  }

  return { success: true };
};
