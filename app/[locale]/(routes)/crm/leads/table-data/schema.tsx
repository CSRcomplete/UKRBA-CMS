import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const leadSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date().optional().nullable(),
  updatedAt: z.coerce.date().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  postcode: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  personalEmail: z.string().optional().nullable(),
  personAddress: z.string().optional().nullable(),
  seniority: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  profileSummary: z.string().optional().nullable(),
  companyLinkedinUrl: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  companySummary: z.string().optional().nullable(),
  employeeCount: z.string().optional().nullable(),
  companyAddress: z.string().optional().nullable(),
  companyCity: z.string().optional().nullable(),
  companyEmail: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  annualRevenue: z.string().optional().nullable(),
});

export type Lead = z.infer<typeof leadSchema>;
