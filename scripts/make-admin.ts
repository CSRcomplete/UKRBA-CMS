import { prismadb } from "../lib/prisma";

async function run() {
  const email = "alexwixpartner@gmail.com";
  console.log(`Checking user: ${email}...`);
  
  const user = await prismadb.users.findUnique({
    where: { email }
  });

  if (!user) {
    console.log(`User not found: ${email}`);
    process.exit(1);
  }

  console.log(`Current role: ${user.role}`);
  
  if (user.role !== "admin") {
    await prismadb.users.update({
      where: { email },
      data: { role: "admin" }
    });
    console.log(`User role successfully updated to 'admin'!`);
  } else {
    console.log(`User is already an admin.`);
  }

  process.exit(0);
}

run();
