"use server";
import {
  requireAuthenticated,
  AuthenticationError,
} from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface CreateRepositoryDocumentInput {
  name: string;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  description?: string;
  level: "regional_director" | "area_director" | "channel_partner";
  assignedUser: string;
}

export async function createRepositoryDocument(input: CreateRepositoryDocumentInput) {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) throw new Error("Unauthorized");
    throw e;
  }

  const document = await prismadb.documents.create({
    data: {
      v: 0,
      document_name: input.name,
      description: input.description || "new repository file",
      document_file_url: input.url,
      key: input.key,
      size: input.size,
      document_file_mimeType: input.mimeType,
      createdBy: user.id,
      created_by_user: user.id,
      assigned_user: input.assignedUser,
      visibility: input.level, // Store level in visibility field
    },
  });

  revalidatePath("/[locale]/(routes)/repository");
  return document;
}
