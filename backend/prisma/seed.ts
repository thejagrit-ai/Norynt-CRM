// backend/prisma/seed.ts
// Faz 2: tüm izinler + 5 varsayılan rol (izin eşlemeleriyle) + admin kullanıcı.
// Idempotent — tekrar çalıştırılabilir.
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_NAMES,
} from '../src/common/constants/permission.enum';

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
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@crm.dev';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!2026';
  const bcryptCost = Number(process.env.BCRYPT_COST ?? 12);

  // 1) All permissions.
  for (const action of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { action },
      update: {},
      create: { action },
    });
  }
  const allPerms = await prisma.permission.findMany({
    select: { id: true, action: true },
  });
  const permIdByAction = new Map(allPerms.map((p) => [p.action, p.id]));

  // 2) Default roles + permission mappings.
  for (const [roleName, actions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { description: ROLE_DESCRIPTIONS[roleName] || `${roleName} Role` },
      create: { name: roleName, description: ROLE_DESCRIPTIONS[roleName] || `${roleName} Role` },
    });
    for (const action of actions) {
      const permissionId = permIdByAction.get(action);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  // 3) Admin user + ADMIN role.
  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: ROLE_NAMES.ADMIN },
  });
  const passwordHash = await bcrypt.hash(adminPassword, bcryptCost);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      isActive: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  // 4) Default sales pipeline & stages (idempotent).
  let pipeline = await prisma.pipeline.findFirst({ where: { isDefault: true } });
  if (!pipeline) {
    pipeline = await prisma.pipeline.create({
      data: {
        name: 'Sales Pipeline',
        isDefault: true,
        stages: {
          create: [
            { name: 'New Lead', position: 0 },
            { name: 'Contacted', position: 1 },
            { name: 'Proposal Sent', position: 2 },
            { name: 'Closed Won', position: 3, isWon: true },
            { name: 'Closed Lost', position: 4, isLost: true },
          ],
        },
      },
    });
  }

  // Güvenlik: düz parola loglanmaz.
  console.log(
    `Seed tamam. İzinler: ${ALL_PERMISSIONS.length}, roller: ${
      Object.keys(DEFAULT_ROLE_PERMISSIONS).length
    }. Admin: ${adminEmail} (ADMIN). Pipeline: ${pipeline.name} (5 stage).`,
  );
}

main()
  .catch((e) => {
    console.error('Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
