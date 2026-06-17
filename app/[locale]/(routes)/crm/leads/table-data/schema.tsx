import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const leadSchema = z.object({
  //TODO: fix all the types and nullable
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().min(3).max(30).nonempty(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  postcode: z.string().optional().nullable(),
});

export type Lead = z.infer<typeof leadSchema>;
