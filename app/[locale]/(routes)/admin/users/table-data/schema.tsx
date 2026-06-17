import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const adminUserSchema = z.object({
  id: z.string(),
  created_on: z.coerce.date(),
  lastLoginAt: z.coerce.date().nullable().optional(),
  role: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  email: z.string(),
  userStatus: z.string(),
  userLanguage: z.string(),
  parentId: z.string().nullable().optional(),
  region_id: z.number().nullable().optional(),
  area_id: z.number().nullable().optional(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;
