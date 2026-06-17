import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { AppRole, mapLegacyRole } from "./roles";
import { AuthenticationError, AuthorizationError } from "./errors";

export interface AuthzUser {
  id: string;
  role: AppRole;
  region_id?: number | null;
  area_id?: number | null;
}

export async function requireAuthenticated(): Promise<AuthzUser> {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) throw new AuthenticationError();

  const dbUser = await prismadb.users.findUnique({
    where: { id: userId },
    select: { id: true, role: true, region_id: true, area_id: true },
  });
  if (!dbUser) throw new AuthenticationError();

  return {
    id: dbUser.id,
    role: mapLegacyRole(dbUser.role),
    region_id: dbUser.region_id,
    area_id: dbUser.area_id,
  };
}

export async function requireRole(
  allowedRoles: ReadonlyArray<AppRole>
): Promise<AuthzUser> {
  const user = await requireAuthenticated();
  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError();
  }
  return user;
}

export function isAdmin(user: AuthzUser): boolean {
  return user.role === "admin" || user.role === "ceo";
}

export function isManagerOrAdmin(user: AuthzUser): boolean {
  return (
    user.role === "manager" ||
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director"
  );
}

