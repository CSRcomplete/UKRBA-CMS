"use server";
import {
  requireAuthenticated,
  AuthenticationError,
} from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface CreateRepositoryDocumentInput {
  name: string;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  description?: string;
  folder?: string;
  subfolder?: string;
  level?: string;
  assignedUser?: string | null;
}

export async function createRepositoryDocument(input: CreateRepositoryDocumentInput) {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) throw new Error("Unauthorized");
    throw e;
  }

  const folder = input.folder || "01. Company Information";
  const subfolder = input.subfolder || "General";

  const document = await prismadb.documents.create({
    data: {
      v: 0,
      document_name: input.name,
      description: input.description || `${folder} > ${subfolder}`,
      document_file_url: input.url,
      key: input.key,
      size: input.size,
      document_file_mimeType: input.mimeType,
      createdBy: user.id,
      created_by_user: user.id,
      assigned_user: input.assignedUser || null,
      visibility: "repository",
      tags: {
        folder,
        subfolder,
      },
    },
  });

  revalidatePath("/[locale]/(routes)/repository");
  return document;
}

export async function deleteRepositoryDocument(documentId: string) {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) throw new Error("Unauthorized");
    throw e;
  }

  // Security Check: Only CEO and Admin can delete repository documents
  const role = (user.role || "").toLowerCase();
  if (role !== "admin" && role !== "ceo") {
    throw new Error("Security Restriction: Only Admin and CEO can delete repository files.");
  }

  const existingDoc = await prismadb.documents.findUnique({
    where: { id: documentId },
  });

  if (!existingDoc) {
    throw new Error("Document not found.");
  }

  // Soft delete by updating deletedAt timestamp
  await prismadb.documents.update({
    where: { id: documentId },
    data: {
      deletedAt: new Date(),
    },
  });

  revalidatePath("/[locale]/(routes)/repository");
  return { success: true };
}
