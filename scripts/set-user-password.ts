import { prismadb as prisma } from "../lib/prisma";
import { hashPassword } from "better-auth/crypto";

async function main() {
  const email = process.argv[2];
  const plainPassword = process.argv[3];

  if (!email || !plainPassword) {
    console.error("Usage: npx tsx scripts/set-user-password.ts <email> <new-password>");
    process.exit(1);
  }

  const user = await prisma.users.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User with email "${email}" not found in Users table.`);
    process.exit(1);
  }

  // Better Auth uses scrypt by default (via its hashPassword utility)
  const hashedPassword = await hashPassword(plainPassword);

  // Better Auth stores credentials in the Account table with providerId: "credential"
  const existingAccount = await prisma.account.findFirst({
    where: {
      userId: user.id,
      providerId: "credential",
    },
  });

  if (existingAccount) {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: { password: hashedPassword },
    });
    console.log(`Successfully updated existing credentials account for ${email}`);
  } else {
    await prisma.account.create({
      data: {
        userId: user.id,
        providerId: "credential",
        accountId: user.email,
        password: hashedPassword,
      },
    });
    console.log(`Successfully created new credentials account for ${email}`);
  }

  // Also sync legacy password field just in case
  await prisma.users.update({
    where: { email },
    data: { password: hashedPassword },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
