"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Language, AppRole } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import {
  requireRole,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const createUser = async (data: {
  name: string;
  email: string;
  password?: string;
  role: AppRole;
  language: string;
}) => {
  let actor;
  try {
    // Only admins or ceos can create users
    actor = await requireRole(["admin", "ceo"]);
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }

  const { name, email, password, role, language } = data;

  if (!name || !email || !role || !language) {
    return { error: "Name, Email, Role, and Language are required!" };
  }

  const checkexisting = await prismadb.users.findFirst({
    where: { email },
  });

  if (checkexisting) {
    return { error: "User already exists!" };
  }

  try {
    const hashedPassword = password ? await hashPassword(password) : null;

    const user = await prismadb.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        userStatus: "ACTIVE",
        userLanguage: language as Language,
        role: role as AppRole,
      },
    });

    if (hashedPassword) {
      await prismadb.account.create({
        data: {
          userId: user.id,
          providerId: "credential",
          accountId: user.email,
          password: hashedPassword,
        },
      });
    }

    revalidatePath("/[locale]/(routes)/admin", "page");
    return { success: true };
  } catch (error) {
    console.log("[CREATE_USER]", error);
    return { error: "Failed to create user" };
  }
};
