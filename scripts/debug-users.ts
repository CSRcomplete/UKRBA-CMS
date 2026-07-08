import { prismadb } from "../lib/prisma";

async function main() {
  const users = await prismadb.users.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      userStatus: true,
    },
  });

  console.log("All Users in Database:");
  console.table(users);
}

main().catch(console.error).finally(() => prismadb.$disconnect());
