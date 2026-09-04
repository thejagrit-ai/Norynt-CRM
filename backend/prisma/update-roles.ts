// backend/prisma/update-roles.ts — Update role descriptions and pipelines to English
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLE_DESCRIPTIONS: Record<string, string> = {
  ADMIN: 'Full system access & administrative controls across all CRM modules and settings',
  FINANCE: 'Financial ledger, invoice issuing, payment collection, and revenue reporting',
  MANAGER: 'Team oversight, performance metrics, deal pipeline management, and rep approvals',
  SALES: 'Lead acquisition, deal pipeline closing, contact management, and customer follow-ups',
  SUPPORT: 'Customer ticket resolution, SLA management, customer care, and task tracking',
  VIEWER: 'Read-only access across CRM records, pipeline analytics, and dashboard reports',
};

async function main() {
  console.log('Updating role descriptions to English...');
  for (const [name, description] of Object.entries(ROLE_DESCRIPTIONS)) {
    await prisma.role.updateMany({
      where: { name },
      data: { description },
    });
  }

  // Also update any Turkish default pipeline name/stages if present
  await prisma.pipeline.updateMany({
    where: { name: 'Satış Hattı' },
    data: { name: 'Sales Pipeline' },
  });

  const stages = [
    { tr: 'Yeni', en: 'New Lead' },
    { tr: 'İletişim', en: 'Contacted' },
    { tr: 'Teklif', en: 'Proposal Sent' },
    { tr: 'Kazanıldı', en: 'Closed Won' },
    { tr: 'Kaybedildi', en: 'Closed Lost' },
  ];

  for (const s of stages) {
    await prisma.stage.updateMany({
      where: { name: s.tr },
      data: { name: s.en },
    });
  }

  console.log('Role descriptions and pipeline stages successfully updated to English!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
