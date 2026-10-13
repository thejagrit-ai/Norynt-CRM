const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.NORYNT_DATABASE_URL || process.env.DATABASE_URL },
  },
});

async function main() {
  const userColumns = await prisma.$queryRaw`
    SELECT table_schema, column_name
    FROM information_schema.columns
    WHERE table_name = 'User'
    ORDER BY table_schema, ordinal_position
  `;
  console.log('CRM database user columns:', JSON.stringify(userColumns));
  await prisma.user.findFirst({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      roles: { select: { role: { select: { name: true } } } },
    },
  });
  console.log('Norynt database compatibility check passed.');
}

main()
  .catch((error) => {
    console.error('Norynt database compatibility check failed:', JSON.stringify({
      code: error.code,
      model: error.meta?.modelName,
      column: error.meta?.column,
      table: error.meta?.table,
    }));
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
