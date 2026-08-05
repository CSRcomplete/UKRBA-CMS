"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hashPassword } from "better-auth/crypto";

export async function adminUpdateUserProfile(
  targetUserId: string,
  data: {
    name?: string;
    avatar?: string;
    password?: string;
  }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const role = (session.user.role || "").toLowerCase();
  if (role !== "admin" && role !== "ceo" && role !== "coo") {
    return { error: "Security Restriction: Only CEO and Admin can modify user profiles and passwords." };
  }

  if (!targetUserId) {
    return { error: "Target User ID is required" };
  }

  try {
    const user = await prismadb.users.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      return { error: "User not found" };
    }

    const updateData: Record<string, any> = {};

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }

    if (data.avatar !== undefined) {
      const avatarUrl = data.avatar.trim();
      updateData.avatar = avatarUrl || null;
      updateData.image = avatarUrl || null;
    }

    if (data.password && data.password.trim().length > 0) {
      if (data.password.trim().length < 6) {
        return { error: "Password must be at least 6 characters long" };
      }

      const plainPassword = data.password.trim();
      const hashedPassword = await hashPassword(plainPassword);

      // Update Better Auth credential account
      const existingAccount = await prismadb.account.findFirst({
        where: {
          userId: targetUserId,
          providerId: "credential",
        },
      });

      if (existingAccount) {
        await prismadb.account.update({
          where: { id: existingAccount.id },
          data: { password: hashedPassword },
        });
      } else {
        await prismadb.account.create({
          data: {
            userId: targetUserId,
            providerId: "credential",
            accountId: user.email,
            password: hashedPassword,
          },
        });
      }

      updateData.password = hashedPassword;
    }

    if (Object.keys(updateData).length > 0) {
      await prismadb.users.update({
        where: { id: targetUserId },
        data: updateData,
      });
    }

    revalidatePath("/[locale]/(routes)/admin/users", "page");
    revalidatePath(`/[locale]/(routes)/admin/users/${targetUserId}`, "page");

    return { success: true };
  } catch (error: any) {
    console.error("[ADMIN_UPDATE_USER_PROFILE_ERROR]", error);
    return { error: error.message || "Failed to update user profile" };
  }
}
