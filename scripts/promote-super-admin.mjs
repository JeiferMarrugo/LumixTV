import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const SUPER_ADMIN_ROLE = "super_admin";

const prisma = new PrismaClient();

const email = process.argv[2] ?? process.env.SUPER_ADMIN_EMAIL;

if (!email) {
  console.error("Uso: npm run admin:promote -- tu@correo.com");
  console.error("O define SUPER_ADMIN_EMAIL en .env");
  process.exit(1);
}

const user = await prisma.user.update({
  where: { email },
  data: { role: SUPER_ADMIN_ROLE },
});

console.log(`✓ ${user.name} (${user.email}) ahora es super_admin`);
await prisma.$disconnect();
